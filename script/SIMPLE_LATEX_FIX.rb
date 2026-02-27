# SIMPLE_LATEX_FIX.rb
# Run this in Rails console to manually fix and test

puts "Simple LaTeX Fix Script"
puts "="*60

# Get the rewrite
rewrite = ResumeRewrite.find(1)

# Get the problematic LaTeX
latex = rewrite.latex_code

puts "Original LaTeX length: #{latex.length} characters"

# Apply aggressive fixes
fixed_latex = latex.dup

# Fix 1: C# and F# (most common issue)
before = fixed_latex.count('C#')
fixed_latex.gsub!(/C#/, 'C\\#')
fixed_latex.gsub!(/F#/, 'F\\#')
after = fixed_latex.count('C\\#')
puts "Fixed #{after - before} instances of C#/F#"

# Fix 2: Any standalone # that's not a parameter number
# This is more aggressive - replaces # not followed by a digit
before_count = fixed_latex.scan(/(?<!\\)#(?!\d)/).count
fixed_latex.gsub!(/(?<!\\)#(?!\d)/, '\\#')
after_count = fixed_latex.scan(/\\#(?!\d)/).count
puts "Fixed #{before_count} unescaped # symbols"

# Fix 3: Parameter numbers > 9
before_count = fixed_latex.scan(/#[1-9]\d/).count
fixed_latex.gsub!(/#([1-9]\d)/) { "#9" }  # Replace with #9
puts "Fixed #{before_count} illegal parameter numbers (>9)"

# Fix 4: Unescaped % (not in comments)
# Be careful - % starts comments in LaTeX
# Only fix % that's clearly in text (followed by space or end of line)
before_count = fixed_latex.scan(/(?<!\\)%\s/).count
fixed_latex.gsub!(/(?<!\\)%(\s)/, '\\%\1')
puts "Fixed #{before_count} unescaped % symbols"

# Fix 5: Unescaped & (outside tables)
# This is complex, so we'll be conservative
# Only fix & that's clearly in text
before_count = fixed_latex.scan(/(?<!\\)&(?![&\s]*\\\\)/).count
fixed_latex.gsub!(/(?<!\\)&(?![&\s]*\\\\)/, '\\&')
puts "Fixed #{before_count} unescaped & symbols"

# Fix 6: Unescaped _ (underscores)
before_count = fixed_latex.scan(/(?<!\\)_(?![^}]*\})/).count
fixed_latex.gsub!(/(?<!\\)_/, '\\_')
puts "Fixed #{before_count} unescaped _ symbols"

# Save the fixed version
puts "\n" + "="*60
puts "Fixed LaTeX length: #{fixed_latex.length} characters"

# Update the rewrite with fixed LaTeX
rewrite.update!(latex_code: fixed_latex)
puts "✅ Updated ResumeRewrite #1 with fixed LaTeX"

# Now try to generate PDF
puts "\n" + "="*60
puts "Testing PDF generation with fixed LaTeX..."
puts "="*60

result = LatexOnlinePdfGeneratorService.generate_pdf_from_latex(
  fixed_latex,
  rewrite.id
)

if result[:success]
  puts "✅ SUCCESS! PDF generated"
  puts "PDF size: #{result[:pdf_data].bytesize} bytes"
  
  # Attach it
  rewrite.pdf_file.attach(
    io: StringIO.new(result[:pdf_data]),
    filename: "resume_#{rewrite.id}.pdf",
    content_type: 'application/pdf'
  )
  
  puts "✅ PDF attached to ResumeRewrite #1"
  puts "\nDownload in console:"
  puts "  pdf_data = ResumeRewrite.find(1).pdf_file.download"
  puts "  File.write('/tmp/resume.pdf', pdf_data)"
else
  puts "❌ PDF generation failed: #{result[:error]}"
  puts "\nDebugging: Check line 151 again"
  lines = fixed_latex.split("\n")
  puts "Line 151: #{lines[150]}"
  
  puts "\nContext:"
  (149..153).each do |i|
    puts "#{i}: #{lines[i-1]}" if lines[i-1]
  end
end

puts "\n" + "="*60
