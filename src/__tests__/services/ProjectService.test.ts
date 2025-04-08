import { ProjectService } from "../../services/ProjectService";
import { Project } from "../../models/Project";
import { User } from "../../models/User";
import {
  ValidationError,
  NotFoundError,
  ConflictError,
  AuthorizationError,
} from "../../utils/errors";
import mongoose from "mongoose";
import { UserPayload } from "../../types/UserPayload";

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
      const projectData = {
        name: "Test Project",
      };

      const result = await projectService.createProject(projectData, adminUser);

      expect(result).toBeDefined();
      expect(result.name).toBe(projectData.name);
      expect((result as any)._id).toBeDefined();
    });

    it("should throw AuthorizationError when non-admin tries to create a project", async () => {
      const projectData = {
        name: "Test Project",
      };

      await expect(
        projectService.createProject(projectData, regularUser)
      ).rejects.toThrow(/unauthorized: only admins can manage projects/i);
    });

    it("should throw ValidationError when name is empty", async () => {
      const projectData = {
        name: "",
      };

      await expect(
        projectService.createProject(projectData, adminUser)
      ).rejects.toThrow();
    });

    it("should throw ConflictError when project with same name exists", async () => {
      const projectData = {
        name: "Duplicate Project",
      };

      await projectService.createProject(projectData, adminUser);

      await expect(
        projectService.createProject(projectData, adminUser)
      ).rejects.toThrow(/project with this name already exists/i);
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
      const nonExistentId = new mongoose.Types.ObjectId().toString();

      await expect(
        projectService.getProjectById(nonExistentId, adminUser)
      ).rejects.toThrow(/project not found/i);
    });

    it("should throw ValidationError when project ID is invalid", async () => {
      const invalidId = "not-a-valid-id";

      await expect(
        projectService.getProjectById(invalidId, adminUser)
      ).rejects.toThrow();
    });

    it("should throw AuthorizationError when non-admin tries to get a project", async () => {
      await expect(
        projectService.getProjectById(testProjectId, regularUser)
      ).rejects.toThrow(/unauthorized: only admins can manage projects/i);
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

      await expect(
        projectService.updateProject(testProjectId, updateData, adminUser)
      ).rejects.toThrow(/project with this name already exists/i);
    });

    it("should throw AuthorizationError when non-admin tries to update a project", async () => {
      const updateData = {
        name: "Updated By Non-Admin",
      };
      await expect(
        projectService.updateProject(testProjectId, updateData, regularUser)
      ).rejects.toThrow(/unauthorized: only admins can manage projects/i);
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

      const deletedProject = await Project.findById(testProjectId);
      expect(deletedProject).toBeNull();
    });

    it("should throw NotFoundError when trying to delete a non-existent project", async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();

      await expect(
        projectService.deleteProject(nonExistentId, adminUser)
      ).rejects.toThrow(/project not found/i);
    });

    it("should throw AuthorizationError when non-admin tries to delete a project", async () => {
      await expect(
        projectService.deleteProject(testProjectId, regularUser)
      ).rejects.toThrow(/unauthorized: only admins can manage projects/i);
    });
  });
});
