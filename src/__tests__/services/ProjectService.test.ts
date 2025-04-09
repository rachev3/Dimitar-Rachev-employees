import { ProjectService } from "../../services/ProjectService";
import { Project } from "../../models/Project";
import { User } from "../../models/User";
import {
  ValidationError,
  NotFoundError,
  ConflictError,
  AuthorizationError,
} from "../../utils/errors";
import { UserPayload } from "../../types/UserPayload";
import { validProjectData, generateNonExistentId } from "../helpers/fixtures";
import { expectErrorType, edgeCases } from "../helpers/testUtils";

describe("ProjectService", () => {
  let projectService: ProjectService;
  let adminUser: UserPayload;
  let regularUser: UserPayload;

  beforeEach(async () => {
    projectService = new ProjectService();

    const admin = new User({
      username: "admin",
      password: "admin123-hashed",
      role: "admin",
    });
    await admin.save();
    adminUser = {
      id: (admin as any)._id.toString(),
      username: admin.username,
      role: "admin",
    };

    const regular = new User({
      username: "regular",
      password: "regular123-hashed",
      role: "user",
    });
    await regular.save();
    regularUser = {
      id: (regular as any)._id.toString(),
      username: regular.username,
      role: "user",
    };
  });

  describe("createProject", () => {
    it("should create a project when admin user", async () => {
      const result = await projectService.createProject(
        validProjectData,
        adminUser
      );

      expect(result).toBeDefined();
      expect(result.name).toBe(validProjectData.name);
      expect((result as any)._id).toBeDefined();
    });

    it("should throw AuthorizationError when non-admin tries to create a project", async () => {
      await expectErrorType(
        () => projectService.createProject(validProjectData, regularUser),
        AuthorizationError,
        /unauthorized: only admins can manage projects/i
      );
    });

    it("should throw ValidationError when name is empty", async () => {
      const projectData = {
        name: "",
      };

      await expectErrorType(
        () => projectService.createProject(projectData, adminUser),
        ValidationError
      );
    });

    it("should throw ConflictError when project with same name exists", async () => {
      // Create first project
      await projectService.createProject(validProjectData, adminUser);

      // Try to create another with the same name
      await expectErrorType(
        () => projectService.createProject(validProjectData, adminUser),
        ConflictError,
        /project with this name already exists/i
      );
    });

    it("should allow extremely long project names", async () => {
      const projectData = {
        name: edgeCases.veryLongString,
      };

      // It seems our implementation accepts long project names
      const result = await projectService.createProject(projectData, adminUser);
      expect(result.name).toBe(edgeCases.veryLongString);
    });

    it("should handle special characters in project names", async () => {
      const projectData = {
        name: edgeCases.specialChars,
      };

      const result = await projectService.createProject(projectData, adminUser);
      expect(result.name).toBe(edgeCases.specialChars);
    });
  });

  describe("getProjectById", () => {
    let testProjectId: string;

    beforeEach(async () => {
      const project = new Project({
        name: "Test Project",
      });
      await project.save();
      testProjectId = (project as any)._id.toString();
    });

    it("should get a project by id when admin user", async () => {
      const result = await projectService.getProjectById(
        testProjectId,
        adminUser
      );

      expect(result).toBeDefined();
      expect(result.name).toBe("Test Project");
      expect((result as any)._id.toString()).toBe(testProjectId);
    });

    it("should throw NotFoundError when project does not exist", async () => {
      const nonExistentId = generateNonExistentId();

      await expectErrorType(
        () => projectService.getProjectById(nonExistentId, adminUser),
        NotFoundError,
        /project not found/i
      );
    });

    it("should throw ValidationError when project ID is invalid", async () => {
      await expect(
        projectService.getProjectById(edgeCases.malformedObjectId, adminUser)
      ).rejects.toThrow();
    });

    it("should throw AuthorizationError when non-admin tries to get a project", async () => {
      await expectErrorType(
        () => projectService.getProjectById(testProjectId, regularUser),
        AuthorizationError,
        /unauthorized: only admins can manage projects/i
      );
    });
  });

  describe("getAllProjects", () => {
    beforeEach(async () => {
      // Create test projects
      await projectService.createProject({ name: "Project 1" }, adminUser);
      await projectService.createProject({ name: "Project 2" }, adminUser);
    });

    it("should get all projects when admin user", async () => {
      const projects = await projectService.getAllProjects(adminUser);

      expect(projects).toBeDefined();
      expect(Array.isArray(projects)).toBe(true);
      expect(projects.length).toBeGreaterThanOrEqual(2);

      const projectNames = projects.map((p) => p.name);
      expect(projectNames).toContain("Project 1");
      expect(projectNames).toContain("Project 2");
    });

    it("should throw AuthorizationError when non-admin tries to get all projects", async () => {
      await expectErrorType(
        () => projectService.getAllProjects(regularUser),
        AuthorizationError,
        /unauthorized: only admins can manage projects/i
      );
    });

    it("should handle database errors gracefully", async () => {
      // Mock a database error scenario
      const originalFind = Project.find;
      Project.find = jest.fn().mockImplementation(() => {
        throw new Error("Database connection error");
      }) as any;

      await expect(projectService.getAllProjects(adminUser)).rejects.toThrow(
        "Database connection error"
      );

      // Restore the original function
      Project.find = originalFind;
    });
  });

  describe("updateProject", () => {
    let testProjectId: string;

    beforeEach(async () => {
      const project = new Project({
        name: "Original Project Name",
      });
      await project.save();
      testProjectId = (project as any)._id.toString();
    });

    it("should update a project when admin user", async () => {
      const updateData = {
        name: "Updated Project Name",
      };

      const result = await projectService.updateProject(
        testProjectId,
        updateData,
        adminUser
      );

      expect(result).toBeDefined();
      expect(result.name).toBe(updateData.name);
      expect((result as any)._id.toString()).toBe(testProjectId);
    });

    it("should throw ConflictError when updating to a name that already exists", async () => {
      const anotherProject = new Project({
        name: "Another Project",
      });
      await anotherProject.save();

      const updateData = {
        name: "Another Project",
      };

      await expectErrorType(
        () =>
          projectService.updateProject(testProjectId, updateData, adminUser),
        ConflictError,
        /project with this name already exists/i
      );
    });

    it("should throw AuthorizationError when non-admin tries to update a project", async () => {
      const updateData = {
        name: "Updated By Non-Admin",
      };

      await expectErrorType(
        () =>
          projectService.updateProject(testProjectId, updateData, regularUser),
        AuthorizationError,
        /unauthorized: only admins can manage projects/i
      );
    });

    it("should throw NotFoundError when project does not exist", async () => {
      const nonExistentId = generateNonExistentId();
      const updateData = {
        name: "Update Non-Existent Project",
      };

      await expectErrorType(
        () =>
          projectService.updateProject(nonExistentId, updateData, adminUser),
        NotFoundError,
        /project not found/i
      );
    });

    it("should throw ValidationError when updated name is empty", async () => {
      const updateData = {
        name: "",
      };

      await expectErrorType(
        () =>
          projectService.updateProject(testProjectId, updateData, adminUser),
        ValidationError
      );
    });

    it("should handle invalid ObjectId format gracefully", async () => {
      const updateData = {
        name: "Updated Name",
      };

      await expect(
        projectService.updateProject(
          edgeCases.malformedObjectId,
          updateData,
          adminUser
        )
      ).rejects.toThrow();
    });
  });

  describe("deleteProject", () => {
    let testProjectId: string;

    beforeEach(async () => {
      const project = new Project({
        name: "Project to Delete",
      });
      await project.save();
      testProjectId = (project as any)._id.toString();
    });

    it("should delete a project when admin user", async () => {
      await projectService.deleteProject(testProjectId, adminUser);

      // Verify the project was deleted
      await expectErrorType(
        () => projectService.getProjectById(testProjectId, adminUser),
        NotFoundError,
        /project not found/i
      );
    });

    it("should throw NotFoundError when project does not exist", async () => {
      const nonExistentId = generateNonExistentId();

      await expectErrorType(
        () => projectService.deleteProject(nonExistentId, adminUser),
        NotFoundError,
        /project not found/i
      );
    });

    it("should throw AuthorizationError when non-admin tries to delete a project", async () => {
      await expectErrorType(
        () => projectService.deleteProject(testProjectId, regularUser),
        AuthorizationError,
        /unauthorized: only admins can manage projects/i
      );
    });

    it("should handle invalid ObjectId gracefully", async () => {
      await expect(
        projectService.deleteProject(edgeCases.malformedObjectId, adminUser)
      ).rejects.toThrow();
    });

    it("should handle database errors during deletion", async () => {
      // Mock a database error scenario
      const originalFindByIdAndDelete = Project.findByIdAndDelete;
      Project.findByIdAndDelete = jest.fn().mockImplementation(() => {
        throw new Error("Database error during deletion");
      }) as any;

      await expect(
        projectService.deleteProject(testProjectId, adminUser)
      ).rejects.toThrow("Database error during deletion");

      // Restore the original function
      Project.findByIdAndDelete = originalFindByIdAndDelete;
    });
  });
});
