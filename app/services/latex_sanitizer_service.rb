class LatexSanitizerService
  def self.sanitize(latex_code)
    code = latex_code.to_s
    Rails.logger.info("Sanitizing LaTeX code (#{code.length} chars)")

    sanitized = code.dup
    sanitized = fix_parameter_numbers(sanitized)
    sanitized = fix_special_characters(sanitized)
    sanitized = fix_macro_definitions(sanitized)
    sanitized = remove_problematic_chars(sanitized)

    Rails.logger.info("LaTeX sanitized successfully")
    sanitized
  end

  def self.validate(latex_code)
    code = latex_code.to_s
    errors = []

    errors << "Missing \\documentclass" unless code.include?("\\documentclass")
    errors << "Missing \\begin{document}" unless code.include?("\\begin{document}")
    errors << "Missing \\end{document}" unless code.include?("\\end{document}")

    open_braces = code.count("{")
    close_braces = code.count("}")
    if open_braces != close_braces
      errors << "Unbalanced braces: #{open_braces} open, #{close_braces} close"
    end

    errors << "Contains #10 or higher parameter numbers in macro definitions" if illegal_parameter_numbers_in_macros?(code)
    errors << "May contain unescaped & outside tabular" if problematic_ampersands?(code)

    if errors.any?
      Rails.logger.warn("LaTeX validation found issues: #{errors.join(', ')}")
    else
      Rails.logger.info("LaTeX validation passed")
    end

    { valid: errors.empty?, errors: errors }
  end

  private_class_method def self.fix_parameter_numbers(latex)
    lines = latex.split("\n")

    lines.map do |line|
      # Keep plain text like "Top #10 achievements" intact. Only normalize
      # invalid macro params inside macro-definition lines.
      next line unless line.match?(/\\(?:newcommand|def|renewcommand)\b/)

      line.gsub(/(?<!\\)#(\d{2,})/) do |match|
        number = Regexp.last_match(1).to_i
        if number >= 10
          Rails.logger.warn("Fixed illegal parameter number in macro definition: #{match} -> #9")
          "#9"
        else
          match
        end
      end
    end.join("\n")
  end

  # private_class_method def self.fix_special_characters(latex)
  #   lines = latex.split("\n")
  #   escaped = lines.map do |line|
  #     escaped_line = line.gsub(/(?<!\\)C#/, "C\\#")

  #     if line.match?(/\\(?:newcommand|def|renewcommand)\b/)
  #       # Preserve macro parameter markers like #1 in definitions.
  #       escaped_line.gsub(/(?<!\\)#(?!\d)/, "\\\\#")
  #     else
  #       # In plain text lines, all unescaped # are invalid and should be literal.
  #       escaped_line.gsub(/(?<!\\)#/, "\\\\#")
  #     end
  #   end

  #   # Escape unescaped ampersands outside alignment/table environments.
  #   escape_ampersands_outside_alignment(escaped.join("\n"))
  # end

  private_class_method def self.fix_special_characters(latex)
    lines = latex.split("\n")

    escaped = lines.map do |line|
      # Only escape C# (like C# the language) → C\#
      escaped_line = line.gsub(/(?<!\\)C#/, "C\\#")

      if line.match?(/\\(?:newcommand|def|renewcommand)\b/)
        # In macro definitions: only escape # not followed by a digit
        escaped_line.gsub(/(?<!\\)#(?!\d)/, "\\\\#")
      else
        # In body content: only escape # not followed by a digit
        # Leave #1, #2 etc. completely untouched — they are valid LaTeX parameter refs
        escaped_line.gsub(/(?<!\\)#(?!\d)/, "\\\\#")
      end
    end

    escape_ampersands_outside_alignment(escaped.join("\n"))
  end

  private_class_method def self.fix_macro_definitions(latex)
    latex.gsub(/\\(def|newcommand|renewcommand)\s*\{[^}]*\}\s*\[[^\]]*\]\s*\{([^}]*#[1-9]\d[^}]*)\}/) do |match|
      Rails.logger.warn("Found potentially problematic macro: #{match[0..50]}...")
      match
    end
  end

  private_class_method def self.remove_problematic_chars(latex)
    latex.gsub(/[\u200B-\u200D\uFEFF]/, "")
  end

  private_class_method def self.problematic_ampersands?(latex)
    lines = latex.split("\n")
    in_tabular = false

    lines.any? do |line|
      in_tabular = true if line.match?(/\\begin\{(tabular|align|array)/)
      in_tabular = false if line.match?(/\\end\{(tabular|align|array)/)

      !in_tabular && line.match?(/(?<!\\)&/)
    end
  end

  private_class_method def self.escape_ampersands_outside_alignment(latex)
    lines = latex.split("\n")
    in_tabular = false

    escaped = lines.map do |line|
      in_tabular = true if line.match?(/\\begin\{(tabular|align|array)/)
      in_tabular = false if line.match?(/\\end\{(tabular|align|array)/)
      next line if in_tabular

      line.gsub(/(?<!\\)&/, "\\\\&")
    end

    escaped.join("\n")
  end

  private_class_method def self.illegal_parameter_numbers_in_macros?(latex)
    latex.split("\n").any? do |line|
      line.match?(/\\(?:newcommand|def|renewcommand)\b/) && line.match?(/(?<!\\)#[1-9]\d/)
    end
  end
end
