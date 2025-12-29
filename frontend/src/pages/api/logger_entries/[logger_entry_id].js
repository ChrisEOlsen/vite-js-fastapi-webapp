// frontend/src/pages/api/logger_entries/[logger_entry_id].js
import { signedFetch } from "@/lib/signedFetch";

export default async function handler(req, res) {
  const { logger_entry_id } = req.query;

  if (req.method === 'PUT') {
    return handlePut(req, res, logger_entry_id);
  }

  if (req.method === 'DELETE') {
    return handleDelete(req, res, logger_entry_id);
  }

  res.setHeader('Allow', ['PUT', 'DELETE']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}

async function handlePut(req, res, logger_entry_id) {
  try {
    const backendResponse = await signedFetch(`/logger_entries/${ logger_entry_id }`, req, {
      method: 'PUT',
      body: JSON.stringify(req.body),
    });
    const data = await backendResponse.json();
    if (!backendResponse.ok) {
      return res.status(backendResponse.status).json({ error: data.detail || 'Failed to update logger_entry' });
    }
    return res.status(200).json(data);
  } catch (err) {
    console.error(`Error updating logger_entry ${ logger_entry_id }}:`, err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

async function handleDelete(req, res, logger_entry_id) {
  try {
    const backendResponse = await signedFetch(`/logger_entries/${ logger_entry_id }`, req, {
      method: 'DELETE',
    });

    if (!backendResponse.ok) {
      const data = await backendResponse.json().catch(() => ({}));
      return res.status(backendResponse.status).json({ error: data.detail || 'Failed to delete logger_entry' });
    }
    
    if (backendResponse.status === 204) {
        return res.status(204).end();
    }

    const data = await backendResponse.json();
    return res.status(200).json(data);

  } catch (err) {
    console.error(`Error deleting logger_entry ${ logger_entry_id }}:`, err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}