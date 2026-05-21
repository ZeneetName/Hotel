function resolveDefaultOrigin() {
  if (typeof window === "undefined") return "http://127.0.0.1:8000";
  const { origin, port } = window.location;
  if (origin && origin !== "null") {
    if (port === "8000") return origin;
    if (!port || port === "80" || port === "443") return origin;
  }
  return "http://127.0.0.1:8000";
}

const DEFAULT_ORIGIN = resolveDefaultOrigin();

var API = {
  get origin() {
    const stored = localStorage.getItem("api_origin");
    if (stored && String(stored).trim()) {
      return String(stored).trim().replace(/\/+$/, "");
    }
    return resolveDefaultOrigin();
  },
  set origin(v) {
    if (!v) {
      localStorage.setItem("api_origin", DEFAULT_ORIGIN);
    } else {
      let o = String(v).trim().replace(/\/+$/, "");
      if (!/^https?:\/\//i.test(o)) o = "http://" + o;
      localStorage.setItem("api_origin", o);
    }
  },
  basePath: "/api",
};

function sameOriginAsPage() {
  return (
    typeof window !== "undefined" &&
    API.origin.replace(/\/+$/, "") === window.location.origin
  );
}

function apiUrl(path) {
  const p = path.startsWith("/") ? path : `/${path}`;
  if (sameOriginAsPage()) return `${API.basePath}${p}`;
  return `${API.origin.replace(/\/+$/, "")}${API.basePath}${p}`;
}

function mediaUrl(maybePath) {
  if (!maybePath) return "";
  const s = String(maybePath);
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  const path = s.startsWith("/") ? s : `/${s}`;
  if (sameOriginAsPage()) return path;
  return `${API.origin.replace(/\/+$/, "")}${path}`;
}

function getToken() {
  return localStorage.getItem("auth_token");
}

function setToken(token) {
  if (token) localStorage.setItem("auth_token", token);
  else localStorage.removeItem("auth_token");
}

function getUserId() {
  return localStorage.getItem("user_id");
}

function setUserId(id) {
  if (id) localStorage.setItem("user_id", id);
  else localStorage.removeItem("user_id");
}

async function request(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  const token = getToken();
  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  const isForm = options.body instanceof FormData;
  if (!isForm && options.body && typeof options.body === "object" && !(options.body instanceof Blob)) {
    headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(options.body);
  }

  const url = apiUrl(path);
  let res;

  try {
    res = await fetch(url, {
      ...options,
      headers,
      mode: "cors",
    });
  } catch (e) {
    throw new Error(`Сетевая ошибка. Не удалось выполнить запрос к бэкенду по адресу: ${url}. Проверьте, запущен ли контейнер hotel-backend.`);
  }

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    let msg;
    if (typeof data === "string") {
      const isHtml = data.trim().startsWith("<!") || data.includes("<html");
      msg = isHtml
        ? `Сервер вернул HTML-страницу вместо данных (Ошибка ${res.status}). Убедитесь, что эндпоинт ${path} существует в urls.py на бэкенде.`
        : data.slice(0, 280);
    } else {
      msg = JSON.stringify(data);
    }
    const err = new Error(msg);
    err.status = res.status;
    err.body = data;
    throw err;
  }
  return data;
}

const AuthApi = {
  register(body) { return request("/auth/register/", { method: "POST", body }); },
  login(body) { return request("/auth/login/", { method: "POST", body }); },
  me() { return request("/auth/me/", { method: "GET" }); },
};

function buildQuery(params) {
  const q = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value != null && String(value).trim() !== "") q.set(key, String(value).trim());
  });
  const s = q.toString();
  return s ? `?${s}` : "";
}

const HotelApi = {
  list(params) { return request(`/hostel/${buildQuery(params)}`, { method: "GET" }); },
  get(id) { return request(`/hostel/${id}/`, { method: "GET" }); },
  create(formData) { return request("/hostel/", { method: "POST", body: formData }); },
  update(id, formData) { return request(`/hostel/${id}/`, { method: "PATCH", body: formData }); },
  remove(id) { return request(`/hostel/${id}/`, { method: "DELETE" }); },
  finalRating() { return request("/hostel/final_rating/", { method: "GET" }); },
  listRooms(hotelId, params) {
    return request(`/hostel/${hotelId}/room/${buildQuery(params)}`, { method: "GET" });
  },
  createRoom(hotelId, formData) { return request(`/hostel/${hotelId}/room/`, { method: "POST", body: formData }); },
  listReviews(hotelId) { return request(`/hostel/${hotelId}/reviews/`, { method: "GET" }); },
  createReview(hotelId, body) { return request(`/hostel/${hotelId}/reviews/`, { method: "POST", body }); },
};

const RoomApi = {
  list() { return request("/room/", { method: "GET" }); },
  get(id) { return request(`/room/${id}/`, { method: "GET" }); },
  update(id, formData) { return request(`/room/${id}/`, { method: "PATCH", body: formData }); },
  remove(id) { return request(`/room/${id}/`, { method: "DELETE" }); },
  createBooking(roomId, body) { return request(`/room/${roomId}/booking/`, { method: "POST", body }); },
};

const BookingApi = {
  list() { return request("/booking/", { method: "GET" }); },
  get(id) { return request(`/booking/${id}/`, { method: "GET" }); },
  remove(id) { return request(`/booking/${id}/`, { method: "DELETE" }); },
  finalPrice() { return request("/booking/final_price/", { method: "GET" }); },
};

const ReviewApi = {
  update(id, body) { return request(`/reviews/${id}/`, { method: "PATCH", body }); },
  remove(id) { return request(`/reviews/${id}/`, { method: "DELETE" }); },
};
