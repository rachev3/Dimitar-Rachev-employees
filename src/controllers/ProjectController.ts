import {
  JsonController,
  Post,
  Body,
  Get,
  Param,
  Put,
  Delete,
  Authorized,
  CurrentUser,
} from "routing-controllers";
import { Service } from "typedi";
import { ProjectService } from "../services/ProjectService";
import { UserPayload } from "../types/UserPayload";
import { CreateProjectDto, UpdateProjectDto } from "../dtos/ProjectDto";
import { Expose, plainToClass } from "class-transformer";

class ProjectResponse {
  @Expose()
  id!: string;

  @Expose()
  name!: string;

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt!: Date;
}

@JsonController("/projects")
@Service()
export class ProjectController {
  constructor(private projectService: ProjectService) {}

  private transformResponse(project: any) {
    return plainToClass(ProjectResponse, project, {
      excludeExtraneousValues: true,
    });
  }

  @Post()
  @Authorized(["admin"])
  async createProject(
    @Body() body: CreateProjectDto,
    @CurrentUser() currentUser: UserPayload
  ) {
    try {
      const project = await this.projectService.createProject(
        body,
        currentUser
      );
      return {
        success: true,
        project: this.transformResponse(project),
      };
    } catch (error) {
      throw error;
    }
  }

  @Get()
  @Authorized(["admin"])
  async getProjects(@CurrentUser() currentUser: UserPayload) {
    try {
      const projects = await this.projectService.getAllProjects(currentUser);
      return {
        success: true,
        projects: projects.map((project) => this.transformResponse(project)),
      };
    } catch (error) {
      throw error;
    }
  }

  @Get("/:id")
  @Authorized(["admin"])
  async getProjectById(
    @Param("id") id: string,
    @CurrentUser() currentUser: UserPayload
  ) {
    try {
      const project = await this.projectService.getProjectById(id, currentUser);
      return {
        success: true,
        project: this.transformResponse(project),
      };
    } catch (error) {
      throw error;
    }
  }

  @Put("/:id")
  @Authorized(["admin"])
  async updateProject(
    @Param("id") id: string,
    @Body() body: UpdateProjectDto,
    @CurrentUser() currentUser: UserPayload
  ) {
    try {
      const project = await this.projectService.updateProject(
        id,
        body,
        currentUser
      );
      return {
        success: true,
        project: this.transformResponse(project),
      };
    } catch (error) {
      throw error;
    }
  }

  @Delete("/:id")
  @Authorized(["admin"])
  async deleteProject(
    @Param("id") id: string,
    @CurrentUser() currentUser: UserPayload
  ) {
    try {
      await this.projectService.deleteProject(id, currentUser);
      return {
        success: true,
        message: "Project deleted successfully",
      };
    } catch (error) {
      throw error;
    }
  }
}
