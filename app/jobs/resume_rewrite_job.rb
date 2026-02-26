class ResumeRewriteJob < ApplicationJob
  queue_as :default
  sidekiq_options retry: 3, dead: false

  def perform(resume_rewrite_id)
    rewrite = ResumeRewrite.find(resume_rewrite_id)
    rewrite.update!(status: :processing, error_message: nil)

    result = LatexResumeGeneratorService.new.generate(rewrite: rewrite)

    rewrite.update!(
      status: :completed,
      latex_code: result[:latex_code],
      improvements_summary: result[:improvements_summary],
      ai_model: result[:ai_model],
      prompt_tokens: result[:prompt_tokens],
      completion_tokens: result[:completion_tokens],
      total_tokens: result[:total_tokens],
      estimated_cost: result[:estimated_cost]
    )

    attach_pdf_if_possible(rewrite)
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

    rewrite.pdf_file.attach(
      io: StringIO.new(pdf_result[:pdf_data]),
      filename: "resume_rewrite_#{rewrite.id}_#{Time.current.strftime('%Y%m%d')}.pdf",
      content_type: "application/pdf"
    )
  end
end
