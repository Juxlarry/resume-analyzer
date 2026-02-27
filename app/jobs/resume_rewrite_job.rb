class ResumeRewriteJob < ApplicationJob
  queue_as :default
  sidekiq_options retry: 3, dead: false

  def perform(resume_rewrite_id)
    rewrite = ResumeRewrite.find(resume_rewrite_id)
    rewrite.update!(status: :processing, error_message: nil)

    result = LatexResumeGeneratorService.new.generate(rewrite: rewrite)

    # rewrite.update!(
    #   status: :completed,
    #   latex_code: result[:latex_code],
    #   improvements_summary: result[:improvements_summary],
    #   ai_model: result[:ai_model],
    #   prompt_tokens: result[:prompt_tokens],
    #   completion_tokens: result[:completion_tokens],
    #   total_tokens: result[:total_tokens],
    #   estimated_cost: result[:estimated_cost]
    # )

    # Save latex output but stay in :processing until PDF is also attached
    rewrite.update!(
      latex_code: result[:latex_code],
      improvements_summary: result[:improvements_summary],
      ai_model: result[:ai_model],
      prompt_tokens: result[:prompt_tokens],
      completion_tokens: result[:completion_tokens],
      total_tokens: result[:total_tokens],
      estimated_cost: result[:estimated_cost]
    )

    attach_pdf_if_possible(rewrite)

    # Only mark completed once everything is done
    rewrite.update!(status: :completed)

  rescue ActiveRecord::RecordNotFound
    Rails.logger.warn "ResumeRewriteJob skipped - rewrite #{resume_rewrite_id} was not found"
  rescue => e
    Rails.logger.error "ResumeRewriteJob failed for #{resume_rewrite_id}: #{e.class} - #{e.message}"

    rewrite&.update(
      status: :failed,
      error_message: e.message
    )
    raise
  end

  private

  def attach_pdf_if_possible(rewrite)
    pdf_result = LatexOnlinePdfGeneratorService.generate_pdf_from_latex(
      rewrite.latex_code,
      rewrite.id
    )

    unless pdf_result[:success]
      Rails.logger.warn "ResumeRewriteJob PDF generation skipped for #{rewrite.id}: #{pdf_result[:error]}"
      return
    end

    # Get original resume filename without extension, fallback to rewrite id
    original_filename = rewrite.resume_analysis
                             .job_description
                             .resume
                             .filename
                             .base

    
    pdf_filename = "#{original_filename}_rewrite_#{Time.current.strftime('%Y%m%d')}.pdf"

    rewrite.pdf_file.attach(
      io: StringIO.new(pdf_result[:pdf_data]),
      filename: pdf_filename,
      content_type: "application/pdf"
    )

    Rails.logger.info "PDF attached as: #{pdf_filename}"
  end
end
