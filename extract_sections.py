import docx

doc_path = 'Book_with_Shipiki_Project_Documentation.docx'
doc = docx.Document(doc_path)

print("--- Extracting Section 14 and 15 ---")
in_section = False
for i, para in enumerate(doc.paragraphs):
    text = para.text.strip()
    if text.startswith("14.") or "Technical Documentation" in text:
        in_section = True
    if text.startswith("16.") or "Conclusion" in text:
        in_section = False
        
    if in_section and text:
        print(f"[{i}] {text}")

print("--- Done ---")
