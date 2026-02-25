require "net/http"
require "uri"

class ResumePdfGeneratorService
  COMPILE_ENDPOINT = "https://latexonline.cc/compile".freeze
  OPEN_TIMEOUT_SECONDS = 10
  READ_TIMEOUT_SECONDS = 120

  def self.generate_pdf_from_latex(latex_code)
    return failure("LaTeX code is empty") if latex_code.to_s.strip.empty?

    uri = URI.parse(COMPILE_ENDPOINT)
    request = Net::HTTP::Post.new(uri.request_uri)
    request["Content-Type"] = "application/x-www-form-urlencoded"
    request.set_form_data("text" => latex_code)

    response = Net::HTTP.start(
      uri.host,
      uri.port,
      use_ssl: uri.scheme == "https",
      open_timeout: OPEN_TIMEOUT_SECONDS,
      read_timeout: READ_TIMEOUT_SECONDS
    ) do |http|
      http.request(request)
    end

    if response.is_a?(Net::HTTPSuccess)
      return failure("Received empty PDF response") if response.body.blank?

      return {
        success: true,
        pdf_data: response.body
      }
    end

    failure("LaTeX.Online error (#{response.code}): #{response.body.to_s.first(500)}")
  rescue StandardError => e
    failure("LaTeX.Online request failed: #{e.message}")
  end

  def self.failure(error)
    { success: false, error: error } 
  end
end
