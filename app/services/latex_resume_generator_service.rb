class LatexResumeGeneratorService
  SYSTEM_PROMPT = <<~PROMPT
    You are an expert technical resume writer and LaTeX editor.

    You will receive:
    - The original resume text
    - A LaTeX template
    - User-selected improvement suggestions
    - Additional keywords
    - Additional projects
    - Optional special instructions

    Requirements:
    1. Return ONLY valid LaTeX source code (no markdown fences, no explanations).
    2. Keep ATS readability high and use clear, quantifiable impact statements.
    3. Integrate accepted suggestions, keywords, and additional projects naturally.
    4. Preserve a one-page professional structure when possible.
    5. Follow the provided template style and macros.
  PROMPT

  INPUT_COST_PER_1M = 5.0
  OUTPUT_COST_PER_1M = 15.0
  MAX_RESUME_LENGTH = 10000

  def initialize(open_ai_key = nil)
    api_key = open_ai_key || ENV["OPENAI_API_KEY"]
    raise ArgumentError, "OpenAI API key is required" if api_key.to_s.strip.empty?

    @client = OpenAI::Client.new(access_token: api_key)
  end

  def generate(rewrite:)
    analysis = rewrite.resume_analysis
    job_description = analysis.job_description
    raise "Resume file is missing" unless job_description.resume.attached?

    original_resume_text = ResumeParserService.extract_text(job_description.resume)
    validate_resume_text!(original_resume_text)

    template = load_template
    user_prompt = build_user_prompt(
      original_resume_text: truncate_text(original_resume_text, MAX_RESUME_LENGTH),
      template: template,
      rewrite: rewrite,
      job_description_text: job_description.description.to_s
    )

    response = @client.chat(
      parameters: {
        model: "gpt-4o",
        temperature: 0.2,
        max_tokens: 3500,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: user_prompt }
        ]
      }
    )

    latex_code = sanitize_latex(response.dig("choices", 0, "message", "content").to_s)
    validate_latex!(latex_code)

    usage = response["usage"] || {}

    {
      latex_code: latex_code,
      improvements_summary: build_improvements_summary(rewrite),
      ai_model: "gpt-4o",
      prompt_tokens: usage["prompt_tokens"].to_i,
      completion_tokens: usage["completion_tokens"].to_i,
      total_tokens: usage["total_tokens"].to_i,
      estimated_cost: estimate_cost(usage)
    }
  rescue OpenAI::Error => e
    Rails.logger.error "LaTeX generation OpenAI error: #{e.message}"
    raise "OpenAI API error: #{e.message}"
  end

  private

  def validate_resume_text!(text)
    return if text.is_a?(String) && text.strip.length >= 100 && !text.start_with?("Could not")

    raise "Failed to extract a valid resume text"
  end

  def load_template
    template_paths = [
      Rails.root.join("lib/templates/resume_template.tex"),
      Rails.root.join("lib/templates/Latex Resume.txt"),
      Rails.root.join("lib/templates/Latex Code - Resume.txt")
    ]

    path = template_paths.find { |candidate| File.exist?(candidate) }
    raise "LaTeX template file not found in lib/templates" unless path

    File.read(path)
  end

  def truncate_text(text, max_length)
    return text if text.length <= max_length

    text[0...max_length]
  end

  def build_user_prompt(original_resume_text:, template:, rewrite:, job_description_text:)
    <<~PROMPT
      Job Description:
      #{job_description_text}

      Original Resume Text:
      #{original_resume_text}

      Accepted Suggestions:
      #{format_bullets(rewrite.accepted_suggestions)}

      Additional Keywords:
      #{format_bullets(rewrite.additional_keywords)}

      Additional Projects:
      #{format_projects(rewrite.additional_projects)}

      Special Instructions:
      #{rewrite.special_instructions.presence || "None"}

      LaTeX Template to Follow:
      #{template}

      Make improvements to the resume based on the accepted suggestions, additional keywords, and projects. Make sure these suggestions and keywords are naturally integrated into the resume content and are actionable for the user. Follow the structure and style of the provided LaTeX template closely. If there is the possiblity to improve Professional Summary, Skills, or Project descriptions, please do so while maintaining a clear and concise format.

      Where there is additional projects added, if they are professional experience, please add them in the experience section. Follow the order of professional experience and align new projects with the existing ones, keeping the most recent relevant experience above. If they are not professional experience, add a new section for "Additional Projects" at the end of the resume.
      Follow the template structure but feel free to add new sections if needed (e.g. "Additional Projects") to fit the new content.

      Return the full LaTeX document only.
    PROMPT
  end

  def sanitize_latex(content)
    text = content.to_s.strip
    text = text.gsub(/\A```(?:latex)?\s*/i, "")
    text.gsub(/\s*```\z/, "").strip
  end

  def validate_latex!(latex_code)
    return if latex_code.include?("\\documentclass") && latex_code.include?("\\begin{document}") && latex_code.include?("\\end{document}")

    raise "Generated output is not a complete LaTeX document"
  end

  def build_improvements_summary(rewrite)
    parts = []
    parts << "Incorporated #{rewrite.accepted_suggestions.size} accepted suggestion(s)"
    parts << "Added #{rewrite.additional_keywords.size} keyword(s)"
    parts << "Added #{rewrite.additional_projects.size} project(s)"
    parts << "Applied custom instructions" if rewrite.special_instructions.present?
    parts.join(". ")
  end

  def estimate_cost(usage)
    prompt_tokens = usage["prompt_tokens"].to_f
    completion_tokens = usage["completion_tokens"].to_f
    cost = (prompt_tokens / 1_000_000.0) * INPUT_COST_PER_1M
    cost += (completion_tokens / 1_000_000.0) * OUTPUT_COST_PER_1M
    cost.round(6)
  end

  def format_bullets(items)
    array = Array(items)
    return "- None" if array.empty?

    array.map { |item| "- #{item}" }.join("\n")
  end

  def format_projects(projects)
    project_list = Array(projects)
    return "- None" if project_list.empty?

    project_list.map do |project|
      name = project["name"].to_s.strip
      description = project["description"].to_s.strip
      technologies = project["technologies"].to_s.strip
      duration = project["duration"].to_s.strip

      #Allow Angular to mock this structure on Frontend to include projects
      [
        "- Name: #{name.presence || "N/A"}",
        "  Description: #{description.presence || "N/A"}",
        "  Technologies: #{technologies.presence || "N/A"}",
        "  Duration: #{duration.presence || "N/A"}"
      ].join("\n")
    end.join("\n")
  end
end
