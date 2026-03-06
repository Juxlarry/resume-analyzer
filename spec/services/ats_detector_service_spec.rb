require "rails_helper"

RSpec.describe AtsDetectorService do
  let(:client) { instance_double(OpenAI::Client) }

  before do
    allow(OpenAI::Client).to receive(:new).and_return(client)
  end

  it "returns nil for blank input" do
    service = described_class.new("test-key")
    expect(service.detect("")).to be_nil
  end

  it "returns nil for non-http input" do
    service = described_class.new("test-key")
    expect(service.detect("javascript:alert(1)")).to be_nil
  end

  it "returns ATS name from OpenAI JSON response" do
    allow(client).to receive(:chat).and_return(
      {
        "choices" => [
          {
            "message" => {
              "content" => "{\"ats_key\":\"greenhouse\",\"confidence\":\"High\"}"
            }
          }
        ]
      }
    )

    service = described_class.new("test-key")
    expect(service.detect("https://jobs.example.com/backend")).to eq("greenhouse")
  end

  it "returns nil when confidence is low" do
    allow(client).to receive(:chat).and_return(
      {
        "choices" => [
          {
            "message" => {
              "content" => "{\"ats_key\":\"lever\",\"confidence\":\"Low\"}"
            }
          }
        ]
      }
    )

    service = described_class.new("test-key")
    expect(service.detect("https://jobs.example.com/backend")).to be_nil
  end

  it "returns nil when ats_key is unknown even with non-low confidence" do
    allow(client).to receive(:chat).and_return(
      {
        "choices" => [
          {
            "message" => {
              "content" => "{\"ats_key\":\"unknown\",\"confidence\":\"Medium\"}"
            }
          }
        ]
      }
    )

    service = described_class.new("test-key")
    expect(service.detect("https://jobs.example.com/backend")).to be_nil
  end
end
