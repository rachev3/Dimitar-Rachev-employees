import { Service } from "typedi";
import { Project, IProject } from "../models/Project";
import {
  NotFoundError,
  ValidationError,
  AuthorizationError,
  ConflictError,
} from "../utils/errors";
import { UserPayload } from "../types/UserPayload";
import { CreateProjectDto, UpdateProjectDto } from "../dtos/ProjectDto";

@Service()
export class ProjectService {
  private checkAdminPermission(user: UserPayload) {
    if (user.role !== "admin") {
      throw new AuthorizationError(
        "Unauthorized: Only admins can manage projects"
      );
    }
  }

  async createProject(
    input: CreateProjectDto,
    currentUser: UserPayload
  ): Promise<IProject> {
    this.checkAdminPermission(currentUser);

    const existingProject = await Project.findOne({ name: input.name });
    if (existingProject) {
      throw new ConflictError(
        "Project with this name already exists",
        "name",
        input.name
      );
    }

    const project = new Project({
      name: input.name,
    });

    await project.save();
    return project;
  }

  async getAllProjects(currentUser: UserPayload): Promise<IProject[]> {
    this.checkAdminPermission(currentUser);
    return Project.find();
  }

  async getProjectById(
    projectId: string,
    currentUser: UserPayload
  ): Promise<IProject> {
    this.checkAdminPermission(currentUser);

    if (!projectId || typeof projectId !== "string") {
      throw new ValidationError("Valid project ID is required");
    }

    const project = await Project.findById(projectId);
    if (!project) {
      throw new NotFoundError("Project not found", "projectId");
    }

    return project;
  }

  async updateProject(
    projectId: string,
    input: UpdateProjectDto,
    currentUser: UserPayload
  ): Promise<IProject> {
    this.checkAdminPermission(currentUser);

    if (!projectId || typeof projectId !== "string") {
      throw new ValidationError("Valid project ID is required");
    }

    const project = await Project.findById(projectId);
    if (!project) {
      throw new NotFoundError("Project not found", "projectId");
    }

    const existingProject = await Project.findOne({
      name: input.name,
      _id: { $ne: projectId },
    });
    if (existingProject) {
      throw new ConflictError(
        "Project with this name already exists",
        "name",
        input.name
      );
    }

    project.name = input.name;
    await project.save();
    return project;
  }

  async deleteProject(
    projectId: string,
    currentUser: UserPayload
  ): Promise<void> {
    this.checkAdminPermission(currentUser);

    if (!projectId || typeof projectId !== "string") {
      throw new ValidationError("Valid project ID is required");
    }

    const result = await Project.findByIdAndDelete(projectId);
    if (!result) {
      throw new NotFoundError("Project not found", "projectId");
    }
  }
}
