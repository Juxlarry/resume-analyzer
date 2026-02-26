require "cgi"
require "digest"
require "net/http"
require "stringio"
require "uri"

class LatexOnlinePdfGeneratorService
  LATEX_ONLINE_URL = "https://latexonline.cc/compile".freeze
  PRESIGNED_URL_EXPIRATION_SECONDS = 3600
  OPEN_TIMEOUT_SECONDS = 30
  READ_TIMEOUT_SECONDS = 120

  def self.generate_pdf_from_latex(latex_code, resume_rewrite_id)
    return failure("LaTeX code is empty") if latex_code.to_s.strip.empty?

    Rails.logger.info("Starting LaTeX.Online PDF generation for ResumeRewrite ##{resume_rewrite_id}")

    tex_key = upload_to_s3(latex_code, resume_rewrite_id)
    tex_url = generate_presigned_url(tex_key)
    pdf_data = compile_with_latex_online(tex_url)

    if pdf_data.present?
      Rails.logger.info("PDF generated successfully via LaTeX.Online")
      {
        success: true,
        pdf_data: pdf_data,
        content_type: "application/pdf"
      }
    else
      failure("PDF compilation failed")
    end
  rescue StandardError => e
    Rails.logger.error("PDF generation error: #{e.class} - #{e.message}")
    Rails.logger.error(e.backtrace.first(5).join("\n"))
    failure("PDF generation failed: #{e.message}")
  ensure
    delete_from_s3(tex_key) if tex_key.present?
  end

  private_class_method def self.upload_to_s3(latex_code, resume_rewrite_id)
    timestamp = Time.current.to_i
    key = "tmp/latex/resume_#{resume_rewrite_id}_#{timestamp}.tex"

    io = StringIO.new(latex_code)
    checksum = Digest::MD5.base64digest(latex_code)

    active_storage_service.upload(
      key,
      io,
      checksum: checksum,
      content_type: "application/x-latex"
    )

    Rails.logger.info("Uploaded .tex to S3 key: #{key}")
    key
  end

  private_class_method def self.generate_presigned_url(key)
    signer = Aws::S3::Presigner.new(client: s3_client)
    url = signer.presigned_url(
      :get_object,
      bucket: s3_bucket,
      key: key,
      expires_in: PRESIGNED_URL_EXPIRATION_SECONDS
    )
    Rails.logger.info("Generated presigned URL for key: #{key}")
    url
  end

  private_class_method def self.compile_with_latex_online(tex_url)
    compile_url = URI.parse("#{LATEX_ONLINE_URL}?url=#{CGI.escape(tex_url)}")

    response = Net::HTTP.start(
      compile_url.host,
      compile_url.port,
      use_ssl: true,
      open_timeout: OPEN_TIMEOUT_SECONDS,
      read_timeout: READ_TIMEOUT_SECONDS
    ) do |http|
      request = Net::HTTP::Get.new(compile_url.request_uri)
      http.request(request)
    end

    if response.is_a?(Net::HTTPSuccess)
      return nil if response.body.blank?

      Rails.logger.info("LaTeX.Online returned PDF (#{response.body.bytesize} bytes)")
      response.body
    else
      Rails.logger.error("LaTeX.Online error (#{response.code}): #{response.body.to_s.first(500)}")
      nil
    end
  rescue Net::ReadTimeout => e
    Rails.logger.error("LaTeX.Online timeout: #{e.message}")
    nil
  rescue StandardError => e
    Rails.logger.error("LaTeX.Online request error: #{e.class} - #{e.message}")
    nil
  end

  private_class_method def self.delete_from_s3(key)
    active_storage_service.delete(key)
    Rails.logger.info("Cleaned up temporary S3 file: #{key}")
  rescue StandardError => e
    Rails.logger.warn("Failed to delete S3 file #{key}: #{e.message}")
  end

  private_class_method def self.active_storage_service
    service = ActiveStorage::Blob.service
    unless service.is_a?(ActiveStorage::Service::S3Service)
      raise "ActiveStorage service is not S3. Configure `amazon` for this environment."
    end

    service
  end

  private_class_method def self.s3_bucket
    ENV["AWS_S3_BUCKET"].presence || raise("AWS_S3_BUCKET is not set")
  end

  private_class_method def self.s3_client
    Aws::S3::Client.new(
      region: ENV["AWS_REGION"],
      access_key_id: ENV["AWS_ACCESS_KEY_ID"],
      secret_access_key: ENV["AWS_SECRET_ACCESS_KEY"]
    )
  end

  private_class_method def self.failure(error)
    Rails.logger.error(error)
    { success: false, error: error }
  end
end
