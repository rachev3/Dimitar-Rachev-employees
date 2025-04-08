import { Schema, model, Document } from "mongoose";

export interface IProject extends Document {
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Project = model<IProject>("Project", projectSchema);
