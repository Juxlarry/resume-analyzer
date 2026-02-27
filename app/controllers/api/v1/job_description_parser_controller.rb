# app/controllers/api/v1/job_description_parser_controller.rb
class Api::V1::JobDescriptionParserController < ApplicationController
  before_action :authenticate_user!

  MAX_TEXT_LENGTH = 4000

  def parse
    raw_text = params[:text].to_s.strip

    if raw_text.length < 50
      return render json: { error: "Text too short to parse" }, status: :unprocessable_entity
    end

    result = parse_with_openai(raw_text.first(MAX_TEXT_LENGTH))

    render json: result
  rescue => e
    Rails.logger.error("JD parse error: #{e.message}")
    render json: { error: "Failed to parse job description" }, status: :internal_server_error
  end

  private

  def parse_with_openai(text)
    client = OpenAI::Client.new(access_token: ENV["OPENAI_API_KEY"])

    response = client.chat(
      parameters: {
        model: "gpt-4o-mini",  # Fast and cheap for simple parsing
        max_tokens: 1000,
        temperature: 0.3,  # Low for consistent formatting
        messages: [
          {
            role: "system",
            content: "You are a job description parser. Extract job title and description from text. Return ONLY valid JSON with no markdown fences."
          },
          {
            role: "user",
            content: <<~PROMPT
              Extract the job title and full job description from the text below.
              Return ONLY valid JSON in this exact format, nothing else:
              {"title": "...", "description": "..."}

              Include all responsibilities, requirements and qualifications in the description.
              If no clear title exists, infer one from the content.

              Text:
              #{text}
            PROMPT
          }
        ]
      }
    )

    content = response.dig("choices", 0, "message", "content")
    clean = content.gsub(/```json|```/, "").strip
    parsed = JSON.parse(clean)

    raise "Incomplete response" unless parsed["title"].present? && parsed["description"].present?

    { title: parsed["title"], description: parsed["description"] }
  rescue JSON::ParserError => e
    Rails.logger.error("JSON parse error: #{e.message}, Content: #{content}")
    raise "Could not parse AI response"
  rescue OpenAI::Error => e
    Rails.logger.error("OpenAI error: #{e.message}")
    raise "OpenAI API error"
  end
end