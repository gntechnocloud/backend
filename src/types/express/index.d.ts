import { UserDocument } from '../../models/User'; // Adjust path based on your structure

declare global {
  namespace Express {
    interface Request {
      user?: UserDocument; // Or `any` if you're not ready to type it strictly
    }
  }
}
