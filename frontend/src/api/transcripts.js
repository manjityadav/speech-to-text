
const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

export async function saveTranscript({ title, content, language }) {
  const response = await fetch(`${API_URL}/api/transcripts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title, content, language }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Failed to save transcript");
  }

  return result.data;
}

export async function getTranscripts() {
  const response = await fetch(`${API_URL}/api/transcripts`);
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Failed to load history");
  }

  return result.data;
}


export async function updateTranscript(id, updates) {
  const response = await fetch(`${API_URL}/api/transcripts/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Failed to update transcript");
  }

  return result.data;
}

export async function deleteTranscript(id) {
  const response = await fetch(`${API_URL}/api/transcripts/${id}`, {
    method: "DELETE",
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Failed to delete transcript");
  }

  return result;
}
