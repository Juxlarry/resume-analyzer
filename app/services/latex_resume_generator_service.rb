# app/services/latex_resume_generator_service.rb
class LatexResumeGeneratorService
  SYSTEM_PROMPT = <<~PROMPT
    You are an expert ATS-optimized resume writer and LaTeX specialist with 15+ years of experience in technical recruiting and resume optimization.

    TASK: Rewrite a resume to be strongly tailored to the target job description while preserving the candidate's authentic experience.

    WRITING REQUIREMENTS:
    1. Professional Summary: Completely rewrite it to directly mirror the language and priorities of the job description. It must feel tailored, not generic.
    2. Bullet points: Strengthen with quantified achievements where possible (numbers, percentages, scale). Use strong action verbs.
    3. Keywords: Naturally weave ALL provided additional keywords into relevant sections. Do NOT drop any keyword — if it cannot fit into experience bullets, add it to a Skills or Competencies section.
    4. Integrate ALL accepted suggestions, additional keywords, and additional projects naturally.
    5. Fix any grammatical errors or typos from the original resume.
    6. Keep ATS readability high — avoid tables, graphics, and fancy formatting inside content.
    7. Preserve a one-page professional structure when possible.

    LATEX OUTPUT REQUIREMENTS:
    1. Return ONLY the complete LaTeX document — no markdown fences, no explanations, no preamble text.
    2. Start with \\documentclass and end with \\end{document}.
    3. Use only commands and packages from the provided template — do not introduce new ones.
  PROMPT

  INPUT_COST_PER_1M = 5.0
  OUTPUT_COST_PER_1M = 15.0
  MIN_RESUME_LENGTH = 100
  MIN_JOB_DESC_LENGTH = 50
  MAX_RESUME_LENGTH = 10000
  MAX_JOB_DESC_LENGTH = 4000

  def initialize(open_ai_key = nil)
    api_key = open_ai_key || ENV["OPENAI_API_KEY"]
    raise ArgumentError, "OpenAI API key is required" if api_key.to_s.strip.empty?

    @client = OpenAI::Client.new(access_token: api_key)
  end

  def generate(rewrite:)
    analysis = rewrite.resume_analysis
    job_description = analysis.job_description
    raise "Resume file missing" unless job_description.resume.attached?

    original_resume = ResumeParserService.extract_text(job_description.resume)
    validate_resume_text!(original_resume)
    job_description_text = job_description.description.to_s
    validate_job_description_text!(job_description_text)

    # Load template and inject structured resume content
    template = load_template
    filled_template = inject_dynamic_content(template: template, rewrite: rewrite, analysis_data: analysis_data_from(analysis))

    # Build GPT prompt
    user_prompt = build_user_prompt(
      original_resume_text: truncate_text(original_resume, MAX_RESUME_LENGTH),
      template: filled_template,
      rewrite: rewrite,
      job_description_text: truncate_text(job_description_text, MAX_JOB_DESC_LENGTH),
      analysis_data: analysis_data_from(analysis)
    )

    response = @client.chat(
      parameters: {
        model: "gpt-4o",
        temperature: 0.3,
        max_tokens: 4000,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: user_prompt }
        ]
      }
    )

    latex_code = sanitize_latex(response.dig("choices", 0, "message", "content").to_s)
    Rails.logger.debug("RAW GPT OUTPUT:\n#{latex_code[0..3000]}")
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
  end

  private

  # -----------------------------
  # Validation
  # -----------------------------
  def validate_resume_text!(text)
    raise "Invalid resume text" unless text.is_a?(String) && text.strip.length >= MIN_RESUME_LENGTH
  end

  def validate_job_description_text!(text)
    raise "Job description too short" unless text.to_s.strip.length >= MIN_JOB_DESC_LENGTH
  end

  def analysis_data_from(analysis)
    {
      match_score: analysis.match_score,
      verdict: analysis.verdict,
      missing_keywords: Array(analysis.missing_keywords)
    }
  end

  # -----------------------------
  # Template Loading
  # -----------------------------
  def load_template
    path = Rails.root.join("lib/templates/resume_dynamic_preamble.tex")
    raise "LaTeX template file not found" unless File.exist?(path)
    File.read(path)
  end

  # # -----------------------------
  # # Dynamic content injection
  # # -----------------------------

  def inject_dynamic_content(template:, rewrite:, analysis_data:)
    # Only inject what we actually have — let GPT fill the rest from the original resume
    placeholders = {
      "{{NAME}}"                  => "",
      "{{EMAIL}}"                 => "",
      "{{PHONE}}"                 => "",
      "{{LINKEDIN}}"              => "",
      "{{GITHUB}}"                => "",
      "{{EDUCATION_ITEMS}}"       => "",
      "{{EXPERIENCE_ITEMS}}"      => "",
      "{{PROJECT_ITEMS}}"         => "",
      "{{TECHNICAL_SKILLS}}"      => "",
      "{{CERTIFICATES}}"          => "",
      # Also cover the _SECTION variants in case template uses those
      "{{EDUCATION_SECTION}}"     => "",
      "{{EXPERIENCE_SECTION}}"    => "",
      "{{PROJECTS_SECTION}}"      => "",
      "{{SKILLS_SECTION}}"        => "",
      "{{CERTIFICATIONS_SECTION}}" => ""
    }

    placeholders.reduce(template) { |t, (key, value)| t.gsub(key, value) }
  end

  def build_section(list)
    return "" unless list.present?
    list.map { |item| yield(item) }.join("\n\n")
  end

  def build_bullets(items)
    return "" unless items.present?
    items.map { |i| "\\resumeItem{#{i}}" }.join("\n")
  end

  def build_skills_section(skills)
    return "" unless skills.present?
    skills.map { |category, list| "\\textbf{#{category}}: #{list.join(', ')} \\\\" }.join("\n")
  end

  # -----------------------------
  # Utility
  # -----------------------------
  def truncate_text(text, max_length)
    text[0...max_length]
  end

  def sanitize_latex(content)
    content.to_s.strip.gsub(/\A```(?:latex)?\s*/i, "").gsub(/\s*```\z/, "")
  end

  def validate_latex!(latex)
    return if latex.include?("\\documentclass") && latex.include?("\\begin{document}") && latex.include?("\\end{document}")
    raise "Generated output is not a complete LaTeX document"
  end

  def build_user_prompt(original_resume_text:, template:, rewrite:, job_description_text:, analysis_data:)
    <<~PROMPT
      ## Original Resume:
      #{original_resume_text.strip}

      ## Target Job Description:
      #{job_description_text.strip}

      ## Accepted Suggestions (MUST integrate all of these):
      #{rewrite.accepted_suggestions.any? ? rewrite.accepted_suggestions.map { |s| "- #{s}" }.join("\n") : "None"}

      ## Additional Keywords (MUST include every single one, do not skip any):
      #{rewrite.additional_keywords.any? ? rewrite.additional_keywords.join(", ") : "None"}

      ## Additional Projects (MUST add each to the Projects section):
      #{format_projects(rewrite.additional_projects)}

      ## Special Instructions:
      #{rewrite.special_instructions.presence || "None"}

      ## LaTeX Template:
      #{template}

      ## Task:
      Using the original resume content above, produce a fully rewritten, ATS-optimized resume in the LaTeX template provided.

      CHECKLIST BEFORE RETURNING:
      - [ ] Professional summary is rewritten to target the job description
      - [ ] Every accepted suggestion is integrated
      - [ ] Every additional keyword appears somewhere in the document
      - [ ] Every additional project is added to the Projects section
      - [ ] All typos and grammatical errors from the original are fixed
      - [ ] All template placeholders are filled with real content
      - [ ] Output is a complete LaTeX document starting with \\documentclass
    PROMPT
  end

  def build_improvements_summary(rewrite)
    parts = []
    parts << "Accepted suggestions: #{rewrite.accepted_suggestions.size}"
    parts << "Added keywords: #{rewrite.additional_keywords.size}"
    parts << "Added projects: #{rewrite.additional_projects.size}"
    parts << "Custom instructions applied" if rewrite.special_instructions.present?
    parts.join(". ")
  end

  def estimate_cost(usage)
    prompt_tokens = usage["prompt_tokens"].to_f
    completion_tokens = usage["completion_tokens"].to_f
    ((prompt_tokens / 1_000_000.0) * INPUT_COST_PER_1M + (completion_tokens / 1_000_000.0) * OUTPUT_COST_PER_1M).round(6)
  end

  def format_projects(projects)
    return "None" unless projects.present?
    projects.map { |p| "- #{p["name"]}: #{p["description"]} (#{p["technologies"]}, #{p["duration"]})" }.join("\n")
  end
end