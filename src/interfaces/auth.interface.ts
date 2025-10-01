export interface ILoginResponse {
  token: string;
  admin: {
    id: number;
    username: string;
    email: string;
    name: string;
  };
}
