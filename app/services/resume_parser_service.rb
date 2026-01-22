class ResumeParserService 
    def initialize
        # Initialization code if needed
    end 

    def self.extract_text(resume_file)
        #download the file to temp location 
        tempfile = Tempfile.new(['resume', File.extname(resume_file.filename.to_s)])
        # tempfile.binmode 

        begin 
            resume_file.download { |chunk| tempfile.write(chunk) }
        end 
        tempfile.rewind

        case resume_file.content_type
        when "application/pdf"
            extract_text_from_pdf(tempfile.path)
        when "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            extract_text_from_docx(tempfile.path)
        when "application/msword"
            extract_text_from_docx(tempfile.path)
        else
            "Unsupported File Format"
        end
        ensure
            tempfile.close
            tempfile.unlink
        end
    end 

    # def parse(file)
    #     # Placeholder logic for parsing resume files
    #     # In a real implementation, this would extract text from various file formats (PDF, DOCX, etc.)
    #     extracted_text = "Extracted text from the resume file."
    #     extracted_text
    # end 


    private 
    def self.extract_text_from_pdf(file_path)
        reader = PDF::Reader.new(file_path)
        text = reader.pages.map(&:text).join("\n")
        text

    rescue => e
        Rails.logger.error "PDF parsing error: #{e.message}"
        "Could not extract text from PDF"
    end 

    def self.extract_text_from_docx(file_path)
        doc = Docx::Document.open(file_path)
        text = doc.paragraphs.map(&:text).join("\n")
        text

        rescue => e
            Rails.logger.error "DOCX parsing error: #{e.message}"
            "Could not extract text from DOCX"
    end
end