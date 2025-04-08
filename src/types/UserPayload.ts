export interface UserPayload {
  id: string;
  username: string;
  role: "admin" | "user";
}
