# DEBUG_LATEX_ISSUE.rb
# Run this in Rails console to debug the LaTeX issue

puts "="*60
puts "LATEX SANITIZATION DEBUG"
puts "="*60

# Step 1: Check if sanitizer exists
begin
  LatexSanitizerService
  puts "✅ LatexSanitizerService loaded"
rescue NameError => e
  puts "❌ LatexSanitizerService NOT FOUND"
  puts "   Make sure you copied latex_sanitizer_service.rb to app/services/"
  exit
end

# Step 2: Test sanitizer with problematic patterns
puts "\n--- Testing Sanitizer ---"

test_cases = [
  "C# programming",
  "F# language", 
  "100% improvement",
  "R&D team",
  "file_name.txt",
  "$100 budget"
]

test_cases.each do |test|
  sanitized = LatexSanitizerService.sanitize(test)
  puts "#{test.ljust(20)} → #{sanitized}"
end

# Step 3: Get the current rewrite
rewrite = ResumeRewrite.find(1)

# Step 4: Check line 151
puts "\n--- Current LaTeX Line 151 ---"
lines = rewrite.latex_code.split("\n")
puts "Line 151: #{lines[150]}"

# Context
puts "\n--- Context (lines 149-153) ---"
(149..153).each do |i|
  puts "#{i}: #{lines[i-1]}" if lines[i-1]
end

# Step 5: Check for all problematic patterns in LaTeX
puts "\n--- Searching for Problematic Patterns ---"

patterns = {
  "Unescaped C#" => /(?<!\\)C#/,
  "Unescaped F#" => /(?<!\\)F#/,
  "Parameter #10+" => /#[1-9]\d/,
  "Unescaped %" => /(?<!\\)%(?![^\n]*%)/,  # % not in comments
}

patterns.each do |name, pattern|
  matches = rewrite.latex_code.scan(pattern)
  if matches.any?
    puts "❌ Found #{matches.count} instance(s) of #{name}"
    matches.first(3).each { |m| puts "   - #{m}" }
  else
    puts "✅ No #{name} found"
  end
end

# Step 6: Test sanitization on the actual LaTeX
puts "\n--- Testing Sanitization on Actual LaTeX ---"

original_latex = rewrite.latex_code
sanitized_latex = LatexSanitizerService.sanitize(original_latex)

if original_latex == sanitized_latex
  puts "⚠️  WARNING: Sanitizer made NO changes!"
  puts "   This means either:"
  puts "   1. LaTeX is already clean, or"
  puts "   2. Sanitizer patterns aren't matching"
else
  puts "✅ Sanitizer made changes"
  
  # Count changes
  original_lines = original_latex.split("\n")
  sanitized_lines = sanitized_latex.split("\n")
  
  changes = 0
  original_lines.each_with_index do |line, i|
    if line != sanitized_lines[i]
      changes += 1
      if changes <= 5
        puts "\n   Line #{i+1} changed:"
        puts "   Before: #{line}"
        puts "   After:  #{sanitized_lines[i]}"
      end
    end
  end
  
  puts "\n   Total lines changed: #{changes}"
end

# Step 7: Validate the LaTeX
puts "\n--- Validation Results ---"
validation = LatexSanitizerService.validate(sanitized_latex)

if validation[:valid]
  puts "✅ LaTeX validation passed"
else
  puts "❌ LaTeX validation failed:"
  validation[:errors].each { |e| puts "   - #{e}" }
end

# Step 8: Check the specific error line
puts "\n--- Analyzing Error Line 151 ---"
error_line = lines[150]

if error_line
  puts "Content: #{error_line}"
  
  # Check for common issues
  issues = []
  issues << "Contains unescaped #" if error_line.match?(/(?<!\\)#(?!\d)/)
  issues << "Contains C#" if error_line.include?("C#")
  issues << "Contains F#" if error_line.include?("F#")
  issues << "Contains unescaped %" if error_line.match?(/(?<!\\)%/)
  issues << "Contains unescaped &" if error_line.match?(/(?<!\\)&/)
  
  if issues.any?
    puts "⚠️  Potential issues found:"
    issues.each { |i| puts "   - #{i}" }
  else
    puts "✅ Line appears clean"
  end
end

# Step 9: Recommendation
puts "\n" + "="*60
puts "RECOMMENDATION"
puts "="*60

if sanitized_latex != original_latex
  puts "The sanitizer IS working and would fix issues."
  puts "Next step: Make sure the job is using the sanitized version."
  puts ""
  puts "Check app/jobs/resume_rewrite_job.rb:"
  puts "It should call LatexOnlinePdfGeneratorService.generate_pdf_from_latex"
  puts "which should sanitize before uploading to S3."
else
  puts "The sanitizer is NOT making changes."
  puts "This could mean:"
  puts "1. The LaTeX is already valid (unlikely given the error)"
  puts "2. The sanitizer patterns need adjustment"
  puts ""
  puts "Next step: Manually fix line 151"
end

puts "="*60
