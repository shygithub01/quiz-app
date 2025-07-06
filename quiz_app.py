import streamlit as st
from openai import OpenAI, RateLimitError, APIError
import pdfplumber
import docx
import pytesseract
from PIL import Image
from striprtf.striprtf import rtf_to_text
import random
import time

# ---------------------------
# 🔧 Setup
# ---------------------------
st.set_page_config(page_title="📄 AI Quiz Generator", layout="centered")
st.title("📄 AI Quiz Generator from Uploaded Files")

openai_api_key = st.secrets["OPENAI_API_KEY"]
client = OpenAI(api_key=openai_api_key)

# ---------------------------
# 🔍 Utilities
# ---------------------------
def extract_text(file):
    if file.type == "application/pdf":
        with pdfplumber.open(file) as pdf:
            return "\n".join([page.extract_text() or "" for page in pdf.pages])
    elif file.type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        doc = docx.Document(file)
        return "\n".join([para.text for para in doc.paragraphs])
    elif file.type == "application/rtf":
        return rtf_to_text(str(file.read(), "utf-8"))
    elif file.type.startswith("image/"):
        image = Image.open(file)
        return pytesseract.image_to_string(image)
    elif file.type == "text/plain":
        return str(file.read(), "utf-8")
    return None

def generate_questions(text, num_questions):
    prompt = f"""
    Create {num_questions} multiple-choice questions from the content below.
    Each question must include:
    - The question text
    - Four options labeled A. B. C. D.
    - A line that says 'Answer: X'

    Example format:
    What is 2+2?
    A. 3
    B. 4
    C. 5
    D. 6
    Answer: B

    Content:
    {text}
    """
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
        )
        return response.choices[0].message.content
    except (RateLimitError, APIError) as e:
        st.error(f"OpenAI error: {e}")
        return None

def parse_questions(raw_text):
    blocks = raw_text.strip().split("\n\n")
    parsed = []
    for block in blocks:
        lines = [line.strip() for line in block.strip().split("\n") if line.strip()]
        if len(lines) >= 6:
            question = lines[0]
            options = lines[1:5]
            answer_line = [line for line in lines if "Answer:" in line]
            if answer_line:
                correct_letter = answer_line[0].strip()[-1].upper()

                # Extract option text without label
                option_map = {}
                for opt in options:
                    if "." in opt:
                        letter, text = opt.split(".", 1)
                        option_map[letter.strip().upper()] = text.strip()

                correct_text = option_map.get(correct_letter, "").strip().casefold()

                # Remove labels and shuffle
                clean_options = list(option_map.values())
                random.shuffle(clean_options)

                # Find new correct index
                correct_idx = next((i for i, opt in enumerate(clean_options)
                                    if opt.strip().casefold() == correct_text), 0)

                parsed.append({
                    "question": question,
                    "options": clean_options,
                    "correct_idx": correct_idx
                })
    random.shuffle(parsed)
    return parsed

# ---------------------------
# 🧠 Session State Setup
# ---------------------------
defaults = {
    "stage": "upload",
    "questions": [],
    "current": 0,
    "score": 0,
    "start_time": None,
    "times": [],
    "selected": []
}
for key, val in defaults.items():
    if key not in st.session_state:
        st.session_state[key] = val

# ---------------------------
# 📤 Upload + Start
# ---------------------------
if st.session_state.stage == "upload":
    uploaded_file = st.file_uploader("Upload a file", type=["pdf", "docx", "txt", "rtf", "png", "jpg", "jpeg"])
    num_questions = st.selectbox("How many questions would you like to generate?", [5, 10, 15], index=0)

    if st.button("Start Quiz"):
        if not uploaded_file:
            st.error("❌ Please upload a file first.")
        else:
            text = extract_text(uploaded_file)
            if not text or len(text.strip()) < 10:
                st.error("❌ Not enough content found in the uploaded file.")
            else:
                with st.spinner("Generating quiz questions..."):
                    raw = generate_questions(text, num_questions)
                if raw:
                    parsed = parse_questions(raw)
                    if parsed:
                        st.session_state.questions = parsed
                        st.session_state.current = 0
                        st.session_state.score = 0
                        st.session_state.times = []
                        st.session_state.selected = []
                        st.session_state.stage = "quiz"
                        st.session_state.start_time = time.time()
                        st.rerun()
                    else:
                        st.error("❌ Failed to parse questions.")

# ---------------------------
# ❓ Quiz In Progress
# ---------------------------
elif st.session_state.stage == "quiz":
    q_list = st.session_state.questions
    idx = st.session_state.current
    if idx < len(q_list):
        q = q_list[idx]
        st.subheader(f"Question {idx + 1} of {len(q_list)}")
        st.progress(idx / len(q_list))
        st.write(q["question"])

        labeled_options = [f"{chr(65+i)}. {opt}" for i, opt in enumerate(q["options"])]
        selected = st.radio("Choose one:", labeled_options, key=f"choice_{idx}")

        if st.button("Next"):
            end_time = time.time()
            time_taken = end_time - st.session_state.start_time
            st.session_state.times.append(time_taken)

            selected_idx = labeled_options.index(selected)
            st.session_state.selected.append({
                "question": q["question"],
                "options": labeled_options,
                "selected_idx": selected_idx,
                "correct_idx": q["correct_idx"]
            })

            if selected_idx == q["correct_idx"]:
                st.session_state.score += 1

            st.session_state.current += 1
            st.session_state.start_time = time.time()
            st.rerun()
    else:
        st.session_state.stage = "result"
        st.rerun()

# ---------------------------
# 🏁 Results + Review + Restart
# ---------------------------
elif st.session_state.stage == "result":
    total = len(st.session_state.questions)
    score = st.session_state.score
    percent = round(score / total * 100)
    avg_time = round(sum(st.session_state.times) / total, 2)

    st.success(f"🎉 Quiz Completed! You scored {score} out of {total} ({percent}%)")
    st.info(f"⏱️ Average Time per Question: {avg_time} seconds")

    st.subheader("📋 Review Answers")
    for i, record in enumerate(st.session_state.selected):
        col1, col2 = st.columns([5, 2])
        with col1:
            st.markdown(f"**Q{i+1}:** {record['question']}")
            for idx, opt in enumerate(record["options"]):
                is_correct = idx == record["correct_idx"]
                is_selected = idx == record["selected_idx"]
                if is_correct and is_selected:
                    st.markdown(f"✅ **{opt}** (Your choice)")
                elif is_correct:
                    st.markdown(f"✅ {opt}")
                elif is_selected:
                    st.markdown(f"❌ ~~{opt}~~ (Your choice)")
                else:
                    st.markdown(f"- {opt}")
        with col2:
            st.markdown(f"🕓 {round(st.session_state.times[i], 2)} sec")

    if st.button("Restart Quiz"):
        for key in list(defaults.keys()):
            st.session_state[key] = defaults[key]
        st.rerun()

