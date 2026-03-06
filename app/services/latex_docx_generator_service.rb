require "open3"
require "tempfile"
require "tmpdir"
require "timeout"

class LatexDocxGeneratorService
  COMMAND_TIMEOUT_SECONDS = 90

  def self.generate_docx_from_latex(latex_code, resume_rewrite_id)
    return failure("LaTeX code is empty") if latex_code.to_s.strip.empty?
    return failure("pandoc is not installed") unless pandoc_available?

    Dir.mktmpdir("rewrite_docx_#{resume_rewrite_id}_") do |dir|
      tex_path = File.join(dir, "resume.tex")
      docx_path = File.join(dir, "resume.docx")

      File.write(tex_path, latex_code)

      cmd = ["pandoc", tex_path, "-f", "latex", "-t", "docx", "-o", docx_path]
      stdout, stderr, status = run_command(cmd, dir)

      unless status.success? && File.exist?(docx_path)
        Rails.logger.error("DOCX generation failed. stdout=#{stdout.to_s.first(500)} stderr=#{stderr.to_s.first(500)}")
        return failure("DOCX generation failed")
      end

      docx_data = File.binread(docx_path)
      return failure("Generated DOCX is empty") if docx_data.blank?

      {
        success: true,
        docx_data: docx_data,
        content_type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      }
    end
  rescue => e
    Rails.logger.error("DOCX generation error for rewrite ##{resume_rewrite_id}: #{e.class} - #{e.message}")
    failure("DOCX generation failed: #{e.message}")
  end

  private_class_method def self.run_command(cmd, workdir)
    Timeout.timeout(COMMAND_TIMEOUT_SECONDS) do
      Open3.capture3(*cmd, chdir: workdir)
    end
  rescue Timeout::Error
    timeout_status = Struct.new(:success?).new(false)
    ["", "Command timed out", timeout_status]
  end

  private_class_method def self.pandoc_available?
    _stdout, _stderr, status = Open3.capture3("which", "pandoc")
    status.success?
  end

  private_class_method def self.failure(message)
    Rails.logger.warn(message)
    { success: false, error: message }
  end
end
