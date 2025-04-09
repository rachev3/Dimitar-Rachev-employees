import { ProjectController } from "../../controllers/ProjectController";
import { ProjectService } from "../../services/ProjectService";
import {
  ValidationError,
  NotFoundError,
  ConflictError,
} from "../../utils/errors";
import {
  adminUser,
  createMockProject,
  validProjectData,
  generateNonExistentId,
  mockServiceMethod,
  mockServiceMethodError,
} from "../helpers/fixtures";
import {
  createValidationError,
  createNotFoundError,
  createConflictError,
  edgeCases,
  verifySuccessResponse,
  expectErrorType,
} from "../helpers/testUtils";

jest.mock("../../services/ProjectService");

describe("ProjectController", () => {
  let projectController: ProjectController;
  let projectService: jest.Mocked<ProjectService>;

  beforeEach(() => {
    jest.clearAllMocks();
    projectService = new ProjectService() as jest.Mocked<ProjectService>;
    projectController = new ProjectController(projectService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("createProject", () => {
    it("should create a project and return transformed response", async () => {
      const mockProject = createMockProject();
      mockServiceMethod(projectService, "createProject", mockProject);

      const result = await projectController.createProject(
        validProjectData,
        adminUser
      );

      expect(projectService.createProject).toHaveBeenCalledWith(
        validProjectData,
        adminUser
      );
      verifySuccessResponse(result, {
        project: {
          id: mockProject.id,
          name: mockProject.name,
          createdAt: mockProject.createdAt,
          updatedAt: mockProject.updatedAt,
        },
      });
    });

    it("should handle validation errors from the service", async () => {
      const error = createValidationError("Project name is required");
      mockServiceMethodError(projectService, "createProject", error);

      await expectErrorType(
        () => projectController.createProject({ name: "" }, adminUser),
        ValidationError,
        "Project name is required"
      );
    });

    it("should handle conflict errors when project name already exists", async () => {
      const error = createConflictError("Project name already exists");
      mockServiceMethodError(projectService, "createProject", error);

      await expectErrorType(
        () => projectController.createProject(validProjectData, adminUser),
        ConflictError,
        "Project name already exists"
      );
    });

    it("should handle extremely long project name input", async () => {
      const error = createValidationError("Project name is too long");
      mockServiceMethodError(projectService, "createProject", error);

      await expectErrorType(
        () =>
          projectController.createProject(
            {
              name: edgeCases.veryLongString,
            },
            adminUser
          ),
        ValidationError,
        "Project name is too long"
      );
    });

    it("should handle special characters in project name", async () => {
      const mockProject = createMockProject({ name: edgeCases.specialChars });
      mockServiceMethod(projectService, "createProject", mockProject);

      const result = await projectController.createProject(
        {
          name: edgeCases.specialChars,
        },
        adminUser
      );

      expect(result.project.name).toBe(edgeCases.specialChars);
    });
  });

  describe("getProjects", () => {
    it("should get all projects and return transformed responses", async () => {
      const mockProjects = [
        createMockProject({ id: "project-1", name: "Project 1" }),
        createMockProject({ id: "project-2", name: "Project 2" }),
      ];

      mockServiceMethod(projectService, "getAllProjects", mockProjects);

      const result = await projectController.getProjects(adminUser);

      expect(projectService.getAllProjects).toHaveBeenCalledWith(adminUser);
      verifySuccessResponse(result, {
        projects: mockProjects.map((project) => ({
          id: project.id,
          name: project.name,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
        })),
      });
    });

    it("should handle empty project list", async () => {
      mockServiceMethod(projectService, "getAllProjects", []);

      const result = await projectController.getProjects(adminUser);

      expect(result.projects).toHaveLength(0);
    });

    it("should handle database errors gracefully", async () => {
      const error = new Error("Database error");
      mockServiceMethodError(projectService, "getAllProjects", error);

      await expect(projectController.getProjects(adminUser)).rejects.toThrow(
        "Database error"
      );
    });
  });

  describe("getProjectById", () => {
    it("should get a project by id and return transformed response", async () => {
      const projectId = "project-id-123";
      const mockProject = createMockProject({ id: projectId });

      mockServiceMethod(projectService, "getProjectById", mockProject);

      const result = await projectController.getProjectById(
        projectId,
        adminUser
      );

      expect(projectService.getProjectById).toHaveBeenCalledWith(
        projectId,
        adminUser
      );
      verifySuccessResponse(result, {
        project: {
          id: mockProject.id,
          name: mockProject.name,
          createdAt: mockProject.createdAt,
          updatedAt: mockProject.updatedAt,
        },
      });
    });

    it("should handle project not found errors", async () => {
      const projectId = generateNonExistentId();
      const error = createNotFoundError("Project not found");

      mockServiceMethodError(projectService, "getProjectById", error);

      await expectErrorType(
        () => projectController.getProjectById(projectId, adminUser),
        NotFoundError,
        "Project not found"
      );
    });

    it("should handle malformed ObjectId", async () => {
      const error = new Error("Invalid ObjectId");
      mockServiceMethodError(projectService, "getProjectById", error);

      await expect(
        projectController.getProjectById(edgeCases.malformedObjectId, adminUser)
      ).rejects.toThrow("Invalid ObjectId");
    });
  });

  describe("updateProject", () => {
    it("should update a project and return transformed response", async () => {
      const projectId = "project-id-123";
      const updateData = { name: "Updated Project" };
      const mockProject = createMockProject({
        id: projectId,
        name: "Updated Project",
      });

      mockServiceMethod(projectService, "updateProject", mockProject);

      const result = await projectController.updateProject(
        projectId,
        updateData,
        adminUser
      );

      expect(projectService.updateProject).toHaveBeenCalledWith(
        projectId,
        updateData,
        adminUser
      );
      verifySuccessResponse(result, {
        project: {
          id: mockProject.id,
          name: mockProject.name,
          createdAt: mockProject.createdAt,
          updatedAt: mockProject.updatedAt,
        },
      });
    });

    it("should handle project not found errors", async () => {
      const projectId = generateNonExistentId();
      const updateData = { name: "Updated Project" };
      const error = createNotFoundError("Project not found");

      mockServiceMethodError(projectService, "updateProject", error);

      await expectErrorType(
        () => projectController.updateProject(projectId, updateData, adminUser),
        NotFoundError,
        "Project not found"
      );
    });

    it("should handle validation errors for empty project name", async () => {
      const projectId = "project-id-123";
      const updateData = { name: "" };
      const error = createValidationError("Project name is required");

      mockServiceMethodError(projectService, "updateProject", error);

      await expectErrorType(
        () => projectController.updateProject(projectId, updateData, adminUser),
        ValidationError,
        "Project name is required"
      );
    });

    it("should handle conflict errors when updating to existing project name", async () => {
      const projectId = "project-id-123";
      const updateData = { name: "Existing Project" };
      const error = createConflictError("Project name already exists");

      mockServiceMethodError(projectService, "updateProject", error);

      await expectErrorType(
        () => projectController.updateProject(projectId, updateData, adminUser),
        ConflictError,
        "Project name already exists"
      );
    });
  });

  describe("deleteProject", () => {
    it("should delete a project and return success message", async () => {
      const projectId = "project-id-123";
      mockServiceMethod(projectService, "deleteProject", undefined);

      const result = await projectController.deleteProject(
        projectId,
        adminUser
      );

      expect(projectService.deleteProject).toHaveBeenCalledWith(
        projectId,
        adminUser
      );
      verifySuccessResponse(result, {
        message: "Project deleted successfully",
      });
    });

    it("should handle project not found errors", async () => {
      const projectId = generateNonExistentId();
      const error = createNotFoundError("Project not found");

      mockServiceMethodError(projectService, "deleteProject", error);

      await expectErrorType(
        () => projectController.deleteProject(projectId, adminUser),
        NotFoundError,
        "Project not found"
      );
    });

    it("should handle database errors during deletion", async () => {
      const projectId = "project-id-123";
      const error = new Error("Database connection error");

      mockServiceMethodError(projectService, "deleteProject", error);

      await expect(
        projectController.deleteProject(projectId, adminUser)
      ).rejects.toThrow("Database connection error");
    });
  });
});
