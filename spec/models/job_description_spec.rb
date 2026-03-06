require "rails_helper"

RSpec.describe JobDescription, type: :model do
  def build_user
    token = SecureRandom.hex(4)
    User.create!(
      email: "user_#{token}@example.com",
      password: "ValidPass1!",
      password_confirmation: "ValidPass1!"
    )
  end

  def build_job_description(job_link: nil)
    described_class.new(
      user: build_user,
      title: "Senior Backend Engineer",
      description: "A" * 80,
      job_link: job_link
    )
  end

  it "accepts plain text context" do
    record = build_job_description(job_link: "Hiring manager wants strong Rails API and Sidekiq ownership.")

    expect(record).to be_valid
    expect(record.job_link).to eq("Hiring manager wants strong Rails API and Sidekiq ownership.")
  end

  it "accepts a valid https URL" do
    record = build_job_description(job_link: "https://company.example/jobs/backend-engineer")

    expect(record).to be_valid
  end

  it "sanitizes html/control characters from text input" do
    record = build_job_description(job_link: "<script>alert(1)</script>  extra \u0000 text")
    record.validate

    expect(record.job_link).to eq("alert(1) extra text")
    expect(record.errors[:job_link]).to be_empty
  end

  it "rejects non-http URL schemes" do
    record = build_job_description(job_link: "javascript:alert(1)")

    expect(record).not_to be_valid
    expect(record.errors[:job_link]).to include("URL scheme is not allowed. Use http(s) URL or plain text")
  end

  it "rejects URL with embedded credentials" do
    record = build_job_description(job_link: "https://user:pass@example.com/job")

    expect(record).not_to be_valid
    expect(record.errors[:job_link]).to include("must not include embedded credentials")
  end
end
