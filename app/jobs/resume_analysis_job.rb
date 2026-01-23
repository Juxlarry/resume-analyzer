class ResumeAnalysisJob < ApplicationJob
  queue_as :default
  sidekiq_options retry: 3, dead: false 


  def perform(job_description_id, user_id)
    job_description = JobDescription.find_by(id: job_description_id, user_id)

    return unless job_description&.resume_file&.attached? 

    #Extract text from resume/cv 
    resume_text = ResumeParserService.extract_text(job_description.resume_file)

    #Call LLM Service 
    analyzer = LLMAnalyzerService.new 

    analysis_result = analyzer.analyze(job_description.description, resume_text)

    #Save analysis
    job_description.create_resume_analysis(
      summary: analysis_result["summary"], 
      strengths: analysis_result["strengths"], 
      weaknesses: analysis_result["weaknesses"],
      recommendations: analysis_result["recommendations"], 
      ai_model_used: "gpt-4-turbo-preview", 
      status: 'completed'
    )

     # Notifying user (can implement ActionCable or email notification here)
    UserMailer.analysis_complete(job_description.user, job_description).deliver_later
  rescue => e
    job_description.cv_analysis.update(status: 'failed', error_message: e.message) if job_description.cv_analysis
    Rails.logger.error "CV Analysis Job failed: #{e.message}"
    raise e if executions < 3 # Retry up to 3 times
  end
end
