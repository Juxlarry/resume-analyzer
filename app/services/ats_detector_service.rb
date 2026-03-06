class AtsDetectorService
  MAX_ATS_NAME_LENGTH = 80

  def initialize(open_ai_key = nil)
    api_key = open_ai_key || ENV["OPENAI_API_KEY"]
    raise ArgumentError, "OpenAI API key is required" if api_key.to_s.strip.empty?

    @client = OpenAI::Client.new(access_token: api_key)
  end

  def detect(job_link)
    link = job_link.to_s.strip
    return nil if link.blank?
    return nil unless http_url?(link)

    system_prompt = build_system_prompt(link)

    response = @client.chat(
      parameters: {
        model: "gpt-4o-mini",
        temperature: 0.0,
        max_tokens: 60,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: system_prompt
          },
          {
            role: "user",
            content: <<~PROMPT
              Analyze this job posting link and determine the ATS system in use:
              #{link}
              Return only the JSON object as specified. No extra text.
            PROMPT
          }
        ]
      }
    )

    parse_ats_name(response)
  rescue => e
    Rails.logger.warn("ATS detection failed: #{e.class} - #{e.message}")
    nil
  end

  private

  def http_url?(value)
    uri = URI.parse(value)
    uri.is_a?(URI::HTTP) && uri.host.present?
  rescue URI::InvalidURIError
    false
  end

  def parse_ats_name(response)
    content = response.dig("choices", 0, "message", "content").to_s
    return nil if content.blank?

    parsed = JSON.parse(content) rescue {}
    confidence = parsed["confidence"].to_s.strip
    return nil if confidence.blank?
    return nil if confidence.casecmp("low").zero?

    ats_name = parsed["ats_key"].to_s.strip
    return nil if ats_name.blank?
    return nil if ats_name.casecmp("null").zero?
    return nil if ats_name.casecmp("unknown").zero?

    cleaned = ActionController::Base.helpers.strip_tags(ats_name).gsub(/[\u0000-\u001F\u007F]/, "").strip
    cleaned = cleaned[0...MAX_ATS_NAME_LENGTH]
    cleaned.presence
  end

  def build_system_prompt(job_link)
    <<~PROMPT
      You are an expert in Applicant Tracking Systems (ATS) and recruiting technology.

      A job link has been provided below. Your task is to analyze it and determine which ATS system the company is most likely using.

      ## Job Link:
      #{job_link}

      ## Instructions:
      1. Inspect the URL structure and domain — many ATS platforms host job postings on recognizable subdomains or URL patterns:
        - Greenhouse: jobs.lever.co, boards.greenhouse.io
        - Lever: jobs.lever.co
        - Workday: [company].wd1.myworkdayjobs.com / wd3 / wd5
        - iCIMS: careers.icims.com or [company].icims.com
        - Taleo: [company].taleo.net
        - SmartRecruiters: jobs.smartrecruiters.com
        - BambooHR: [company].bamboohr.com/jobs
        - Jobvite: jobs.jobvite.com
        - Workable: apply.workable.com
        - AshbyHQ: jobs.ashbyhq.com
        - Rippling: ats.rippling.com
      2. If the URL alone is not conclusive, reason about any embedded platform identifiers in the link (query params, subpaths, tracking tokens).
      3. State your confidence level: High / Medium / Low.
      4. If you cannot determine the ATS from the link alone, say so clearly — do not guess without basis.

      ## Output Format (JSON only, no explanation, no markdown fences):
      {
        "ats_detected": "<ATS name or null>",
        "confidence": "<High | Medium | Low>",
        "reasoning": "<one or two sentence explanation>",
        "ats_key": "<greenhouse | lever | workday | icims | taleo | smartrecruiters | bamboohr | jobvite | workable | ashby | rippling | unknown>"
      }
    PROMPT
  end 
end
