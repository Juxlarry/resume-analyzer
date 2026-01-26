class ResumeAnalysisJob < ApplicationJob
  queue_as :default
  sidekiq_options retry: 3, dead: false 

  def perform(job_description_id)
    job_description = JobDescription.find_by(job_description_id)
    analysis = job_description.resume_analysis

    #Validate prerequisites
    unless job_description&.resume.attached?
      analysis.update!(
        status: :failed, 
        error_message: "No resume attached"
      )
      return
    end 

    #Extract text from resume 
    resume_text = ResumeParserService.extract_text(job_description.resume)

    if resume_text.blank? || resume_text.start_with?("Could not extract", "Unsupported")
      analysis.update!(
        status: :failed, 
        error_message: "Failed to extract text from resume: #{resume_text}"
      )
      return
    end

    #Call LLM Service
    analyzer = LLMAnalyzerService.new
    result = analyzer.analyze(
      job_description.description, 
      resume_text
    )

    #Check for errors in result
    if result[:error]
      analysis.update!(
        status: :failed, 
        error_message: result[:error]
      )
      return
    end

    #Save susccessful analysis
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
        error_message: "Analysis error: #{e.message}"
      )
    end

    raise e if executions < 3 # Retry up to 3 times

  end 
end
