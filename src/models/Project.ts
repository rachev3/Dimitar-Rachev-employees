import { Schema, model, Document } from "mongoose";

export interface IProject extends Document {
  name: string;
}

const projectSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Project = model<IProject>("Project", projectSchema);
