class ResumeParserService 
    def initialize
        # Initialization code if needed
    end 

    def self.extract_text(resume_file)
        return "No resume provided/attached" if  resume_file.blank?

        #download the file to temp location 
        tempfile = Tempfile.new(['resume', File.extname(resume_file.filename.to_s)])
        # tempfile.binmode 

        begin 
            resume_file.download do |chunk|
                tempfile.write(chunk)
        end 
        tempfile.rewind

        #Extract text based on content type
        case resume_file.content_type
        when "application/pdf"
            extract_text_from_pdf(tempfile.path)
        when "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            extract_text_from_docx(tempfile.path)
        when "application/msword"
            extract_text_from_docx(tempfile.path)
        else
            "Unsupported File format: #{resume_attachment.content_type}"
        end
        ensure
            tempfile.close
            tempfile.unlink
        end
    end 

    private 

    def self.extract_text_from_pdf(file_path)
        reader = PDF::Reader.new(file_path)
        text = reader.pages.map(&:text).join("\n").strip

        return "Could not extract text from PDF (empty content)" if text.blank?

        text
    rescue => e
        Rails.logger.error "PDF parsing error: #{e.class} - #{e.message}"
        "Could not extract text from PDF: #{e.message}"
    end 

    def self.extract_text_from_docx(file_path)
        doc = Docx::Document.open(file_path)
        text = doc.paragraphs.map(&:text).join("\n").strip

        return "Could not extract text from DOCX (empty content)" if text.blank?

        text
        rescue => e
            Rails.logger.error "DOCX parsing error: #{e.class} - #{e.message}"
            "Could not extract text from DOCX: #{e.message}"
    end
end