# Place this in, for example, lib/tasks/test_resume_pdf.rb
# Or you can paste directly in rails console

# ====== CONFIG ======
rewrite = ResumeRewrite.first # pick a ResumeRewrite to test
tmp_dir = Rails.root.join("tmp")
tex_file = tmp_dir.join("test_resume.tex")
pdf_file = tmp_dir.join("test_resume.pdf")
# ====================

begin
  # 1️⃣ Generate LaTeX code
  generator = LatexResumeGeneratorService.new
  result = generator.generate(rewrite: rewrite)
  latex_code = result[:latex_code]

  puts "✅ LaTeX code generated (#{latex_code.length} chars)."

  # 2️⃣ Write to temp .tex file
  File.write(tex_file, latex_code)
  puts "✅ LaTeX file saved to #{tex_file}"

  # 3️⃣ Compile LaTeX to PDF
  system("pdflatex -interaction=nonstopmode -output-directory=#{tmp_dir} #{tex_file}")

  if File.exist?(pdf_file)
    puts "✅ PDF generated at #{pdf_file}"
    # Optional: auto-open PDF depending on OS
    case RbConfig::CONFIG['host_os']
    when /darwin/ then system("open #{pdf_file}")
    when /linux/  then system("xdg-open #{pdf_file}")
    when /mswin|mingw|cygwin/ then system("start #{pdf_file}")
    end
  else
    puts "❌ PDF not generated. Check LaTeX compilation log at #{tmp_dir.join('test_resume.log')}"
  end

rescue => e
  puts "❌ Error: #{e.message}"
  puts e.backtrace.join("\n")
end