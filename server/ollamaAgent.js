import ollama from "ollama";

const MODEL = "qwen2.5:7b";

export async function enrichTaskWithOllama(task) {
  const prompt = `
        Phân tích task sau và trả về JSON chỉ chứa các trường:
        {
            "priority": "low" | "medium" | "high",
            "status": "pending" | "in-progress" | "completed",
            "category": "learning" | "work" | "personal" | "general" | ...,
            "reason": "Giải thích ngắn gọn lý do chọn các giá trị trên bằng tiếng Anh (1-2 câu)"
        } 
        Task:
        Title: ${task.title}
        Description: ${task.description || "Không có mô tả"}

        Lý do chọn priority/status/category phải dựa trên nội dung (ví dụ: có từ "urgent", "deadline" => high && in-progress, "học", "code" => category "learning").
        Trả về ***Chỉ JSON***, không thêm text gì khác.
        Ví dụ output:
        {
            "priority": "high",
            "status": "in-progress",
            "category": "learning",
            "reason": "Because has 'Deadline' and 'quick' so must be in high priority, progressing now, in learning category.
        }
    `;

  try {
    const response = await ollama.chat({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: "Bạn là trợ lý phân loại task thông minh. Trả về JSON sạch.",
        },
        { role: "user", content: prompt },
      ],
      options: {
        temperature: 0.3,
        num_ctx: 2084,
      },
      format: "json",
    });

    const rawOuput = response.message.content.trim();

    //parse json
    let enriched;
    try {
      enriched = JSON.parse(rawOuput);
    } catch (parseErr) {
      console.error("Ollama ouput is not JSON:", rawOuput);
      return {
        ...task,
        priority: "medium",
        status: "pending",
        category: "general",
      };
    }

    return {
      ...task,
      priority: enriched.priority || "medium",
      status: enriched.status || "pending",
      category: enriched.category || "general",
      reason: enriched.reason || "No suggestion from AI"
    };
  } catch (err) {
    console.error("Ollama error:", err);
    return {
      ...task,
      priority: "medium",
      status: "pending",
      category: "general",
    };
  }
}
