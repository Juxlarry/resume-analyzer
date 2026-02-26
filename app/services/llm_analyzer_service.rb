class LlmAnalyzerService 
    SYSTEM_PROMPT = <<~PROMPT 
        You are an expert ATS (Applicant Tracking System) analyzer and career advisor with 15+ years of experience in technical recruiting.

        Your task: Evaluate how well a CV/resume matches a job description.

        CRITICAL REQUIREMENTS:
        1. Respond ONLY with valid JSON - no preamble, no explanation, no markdown code blocks
        2. Use the EXACT structure below
        3. Format lists as HTML <ul><li> tags for proper rendering
        4. Be honest but constructive - balance critique with encouragement
        5. Focus on actionable insights

        REQUIRED JSON STRUCTURE:
        {
            "match_score": <number 0-100>,
            "summary": "<2-3 sentence overall assessment>",
            "strengths": "<ul><li>Key strength 1</li><li>Key strength 2</li>...</ul>",
            "weaknesses": "<ul><li>Gap or concern 1</li><li>Gap or concern 2</li>...</ul>",
            "recommendations": "<ul><li>Actionable advice 1</li><li>Actionable advice 2</li>...</ul>",
            "missing_keywords": ["keyword1", "keyword2", "..."],
            "verdict": "<STRONG_MATCH | GOOD_MATCH | PARTIAL_MATCH | WEAK_MATCH>"
        }

        SCORING GUIDE:
        - 90-100: STRONG_MATCH - Exceptional fit, ready to interview
        - 70-89: GOOD_MATCH - Solid candidate with minor gaps
        - 50-69: PARTIAL_MATCH - Potential fit, needs development
        - 0-49: WEAK_MATCH - Significant gaps, major upskilling needed

        ANALYSIS FOCUS AREAS:
        - Technical skills alignment
        - Years of experience match
        - Industry/domain knowledge
        - Education requirements
        - Soft skills and cultural fit indicators
        - ATS keyword optimization
    PROMPT

    #Minimum content lengths 
    MIN_RESUME_LENGTH = 100
    MIN_JOB_DESC_LENGTH = 50

    #Maximum content lengths
    MAX_RESUME_LENGTH = 6000 
    MAX_JOB_DESC_LENGTH = 4000


    def initialize (open_ai_key = nil)
        api_key = open_ai_key || ENV['OPENAI_API_KEY']

        raise ArgumentError, "OpenAI API key is required" if api_key.nil? || api_key.strip.empty?

        @client = OpenAI::Client.new(access_token: api_key)
    end 

    def analyze(job_description, resume_text)
        # Validate inputs
        validation_error = validate_inputs(job_description, resume_text)
        return validation_error if validation_error

        Rails.logger.info "LLM analysis started. No Validation errors. Job description length: #{job_description.length}, Resume length: #{resume_text.length}"

        # Truncate if needed
        job_description = truncate_text(job_description, MAX_JOB_DESC_LENGTH)
        resume_text = truncate_text(resume_text, MAX_RESUME_LENGTH)

        # Build user prompt
        user_prompt = build_user_prompt(job_description, resume_text)

        Rails.logger.info "LLM analysis request initiated. User prompt length: #{user_prompt.length} characters"

        response = @client.chat(
            parameters: {
                model: "gpt-4o-mini",
                messages: [
                    {role: "system", content: SYSTEM_PROMPT},
                    {role: "user", content: user_prompt}
                ], 
                temperature: 0.3, 
                max_tokens: 1500,
                response_format: {type: "json_object"}
            }
        )

        Rails.logger.info "LLM analysis response: #{response}"

        parse_response(response)

    rescue OpenAI::Error => e
        Rails.logger.error "OpenAI API Error: #{e.message}"
        error_response("OpenAI API error: #{e.message}")
    rescue JSON::ParserError => e
        Rails.logger.error "JSON Parse Error: #{e.message}"
        error_response("Failed to parse AI response")
    rescue => e
        Rails.logger.error "LLM Analysis Error: #{e.class} - #{e.message}"
        Rails.logger.error e.backtrace.join("\n")
        error_response("Analysis failed: #{e.message}")
    end
    
    private
    
    def validate_inputs(job_description, resume_text)
        if resume_text.blank? || resume_text.strip.length < MIN_RESUME_LENGTH
            return error_response(
                "Resume is too short or empty. Please provide at least #{MIN_RESUME_LENGTH} characters.",
                0
            )
        end

        if job_description.blank? || job_description.strip.length < MIN_JOB_DESC_LENGTH
            return error_response(
                "Job description is too short. Please provide at least #{MIN_JOB_DESC_LENGTH} characters.",
                0
            )
        end

        nil # No errors
    end

    def truncate_text(text, max_length)
        return text if text.length <= max_length
        
        truncated = text[0...max_length]
        Rails.logger.warn "Text truncated from #{text.length} to #{max_length} characters"
        truncated

        Rails.logger.info "Truncated text: #{truncated[0..100]}..."  # Log first 100 characters
    end

    def build_user_prompt(job_description, resume_text)
        <<~PROMPT
        Job Description:
        #{job_description}

        Resume:
        #{resume_text}

        Analyze match quality. Focus on:
        - Skills alignment (technical & soft)
        - Experience level fit
        - Education/certifications
        - ATS keyword presence
        - Gaps and improvement areas

        Provide match_score, summary, strengths, weaknesses, recommendations, missing_keywords, and verdict.

        Make the recommendations actionable and specific. 
        Use the scoring guide to determine the verdict.

        Remember: Respond ONLY with the JSON object. No additional text.
        PROMPT
    end

    def parse_response(response)
        content = response.dig("choices", 0, "message", "content")
        
        raise "Empty response from OpenAI" if content.blank?

        result = JSON.parse(content)

        Rails.logger.info "LLM analysis parsed result: #{result}"

        # Ensure all required keys exist
        result_hash = {
        match_score: result["match_score"]&.to_i || 0,
        summary: result["summary"] || "Analysis unavailable",
        strengths: sanitize_html(result["strengths"]) || "<ul><li>N/A</li></ul>",
        weaknesses: sanitize_html(result["weaknesses"]) || "<ul><li>N/A</li></ul>",
        recommendations: sanitize_html(result["recommendations"]) || "<ul><li>N/A</li></ul>",
        missing_keywords: result["missing_keywords"] || [],
        verdict: result["verdict"] || "WEAK_MATCH"
        }

        Rails.logger.info "LLM parsed result_hash: #{result_hash}"

        result_hash
    end

    def sanitize_html(html_content)
        return nil if html_content.blank?
        
        # Basic sanitization - allow only ul, li tags
        allowed_tags = %w[ul li]
        ActionController::Base.helpers.sanitize(
        html_content,
        tags: allowed_tags,
        attributes: []
        )
    end

    def error_response(message, score = 0)
        {
        match_score: score,
        summary: message,
        strengths: "<ul><li>Unable to analyze</li></ul>",
        weaknesses: "<ul><li>#{message}</li></ul>",
        recommendations: "<ul><li>Please ensure both resume and job description are complete</li></ul>",
        missing_keywords: [],
        verdict: "WEAK_MATCH",
        error: true
        }
    end
end 
