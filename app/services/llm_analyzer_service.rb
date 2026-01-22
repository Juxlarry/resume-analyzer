class LLMAnalyzerService 
    SYSTEM_PROMPT = <<~PROMPT 
        You are the most qualified expert career advisor, hiring personnel and resume analyzer. Your task is to evaluate how well a given CV/Resume matches a specific job description. Provide insights on strengths, weaknesses, and suggestions for improvement.
        You are a professional career coach and hiring expert. Your task is to analyze a CV/resume against a specific job description.
        
        You MUST respond ONLY with a valid JSON object containing these exact keys:
        {
        "summary": "Brief overall assessment (2-3 sentences)",
        "strengths": "Bullet points of candidate's alignment with the job",
        "weaknesses": "Bullet points of gaps or concerns",
        "recommendations": "Actionable advice for the candidate to improve their fit"
        }
        
        Do not include any explanatory text before or after the JSON.
    PROMPT

    def initialize (open_ai_key = nil)
        @client = OpenAI::Client.new(access_token: open_ai_key) || ENV['OPENAI_API_KEY']
    end 

    def analyze(job_description, resume_text)
        USER_PROMPT = <<~PROMPT
            Job Description: #{job_description}

            CV/Resume Content: #{resume_text}

            Please provide a detailed analysis of how well the CV/Resume matches the Job Description. Highlight key skills, experiences, and qualifications that align with the job requirements. Also, point out any gaps or areas where the CV/Resume could be improved to better fit the job description.
        PROMPT

        response = @client.chat(
            parameters: {
                model: "gpt-4-turbo-preview",
                messages: [
                    {role: "system", content: SYSTEM_PROMPT},
                    {role: "user", content: USER_PROMPT}
                ], 
                temperature: 0.4, 
                response_format: {type: "json"}
            }
        )

        JSON.parse(response.dig("choices", 0, "message", "content"))
        rescue => e 
            { error: "LLM analysis failed: #{e.message}" }
        end
    end 
end 
