class ResumeAnalysisJob < ApplicationJob
  queue_as :default
  sidekiq_options retry: 3, dead: false 

  def perform(job_description_id)
    Rails.logger.info "=== Starting  ResumeAnalysisJob for JD ##{job_description_id} ==="

    job_description = JobDescription.find(job_description_id)
    analysis = job_description.resume_analysis

    unless analysis
      Rails.logger.error "No analysis record found for JD ##{job_description_id}"
      return
    end

    #Validate prerequisites
    unless job_description&.resume.attached?
      analysis.update!(
        status: :failed, 
        error_messages: "No resume attached"
      )
      Rails.logger.error "No resume attached for job_description ##{job_description_id}"
      return
    end 

    #Extract text from resume 
    Rails.logger.info "Extracting text from resume..."
    resume_text = ResumeParserService.extract_text(job_description.resume) 

    unless resume_text.is_a?(String) && resume_text.length >= 100
      error_msg = resume_text.is_a?(String) ? resume_text : "Invalid resume data returned"
      Rails.logger.error "Resume extraction failed: #{error_msg}"
      analysis.update!(
        status: :failed, 
        error_messages: "Failed to extract text from resume"
      )
      return
    end

    Rails.logger.info "Resume text extracted successfully - #{resume_text.length} chars"

    #Call LLM Service
    Rails.logger.info "Calling LLM analyzer..."
    analyzer = LlmAnalyzerService.new
    result = analyzer.analyze(
      job_description.description, 
      resume_text
    )

    #Check for errors in result
    if result[:error]
      analysis.update!(
        status: :failed, 
        error_messages: result[:error]
      )
      return
    end

    #Save susccessful analysis
    Rails.logger.info "Saving analysis results..."
    analysis.update!(
      match_score: result[:match_score],
      summary: result[:summary],
      strengths: result[:strengths],
      weaknesses: result[:weaknesses],
      recommendations: result[:recommendations],
      missing_keywords: result[:missing_keywords],
      verdict: result[:verdict],
      ai_model_used: "gpt-4o-mini",
      status: :completed
    )

    # Notify user (To be implemented later)
    # UserMailer.analysis_complete(job_description.user, job_description).deliver_later

    Rails.logger.info "Resume analysis completed for job_description ##{job_description_id}"


  rescue ActiveRecord::RecordNotFound => e
    Rails.logger.error "Resume Analysis Job failed: #{e.class} - #{e.message}"
    Rails.logger.error e.backtrace.join("\n")

    #Update analysis status
    if job_description&.resume_analysis 
      job_description.resume_analysis.update(
        status: :failed, 
        error_messages: "Analysis error: #{e.message}"
      )
    end

    raise e if executions < 3 # Retry up to 3 times

  end 
end
