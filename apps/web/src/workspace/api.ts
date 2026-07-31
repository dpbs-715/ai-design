import {
  businessSystemSchema,
  designProjectSchema,
  pageMutationResponseSchema,
  pageDeletionResponseSchema,
  projectAssetsResponseSchema,
  publicModuleMutationResponseSchema,
  workspaceBootstrapResponseSchema,
  workspaceSummarySchema,
} from '@ai-design/contracts/workspace'
import type {
  CreateBusinessSystemRequest,
  CreatePageRequest,
  CreateProjectRequest,
  CreatePublicModuleRequest,
  SavePageRequest,
  SavePublicModuleRequest,
  UpdateBusinessSystemRequest,
  UpdateProjectPreferenceRequest,
  UpdateProjectRequest,
} from '@ai-design/contracts/workspace'
import { z } from 'zod'

import { apiNoContent, apiRequest } from '@/api/client.ts'

export function listWorkspaces() {
  return apiRequest('/workspaces', z.array(workspaceSummarySchema))
}

export function getWorkspaceBootstrap(workspaceId: string) {
  return apiRequest(`/workspaces/${workspaceId}/bootstrap`, workspaceBootstrapResponseSchema)
}

export function createSystem(workspaceId: string, body: CreateBusinessSystemRequest) {
  return apiRequest(`/workspaces/${workspaceId}/systems`, businessSystemSchema, {
    method: 'POST',
    data: body,
  })
}

export function updateSystem(
  workspaceId: string,
  systemId: string,
  body: UpdateBusinessSystemRequest,
) {
  return apiRequest(`/workspaces/${workspaceId}/systems/${systemId}`, businessSystemSchema, {
    method: 'PATCH',
    data: body,
  })
}

export function deleteSystem(workspaceId: string, systemId: string) {
  return apiNoContent(`/workspaces/${workspaceId}/systems/${systemId}`, { method: 'DELETE' })
}

export function createProject(workspaceId: string, body: CreateProjectRequest) {
  return apiRequest(`/workspaces/${workspaceId}/projects`, designProjectSchema, {
    method: 'POST',
    data: body,
  })
}

export function updateProject(projectId: string, body: UpdateProjectRequest) {
  return apiRequest(`/projects/${projectId}`, designProjectSchema, {
    method: 'PATCH',
    data: body,
  })
}

export function deleteProject(projectId: string) {
  return apiNoContent(`/projects/${projectId}`, { method: 'DELETE' })
}

export function updateProjectPreference(projectId: string, body: UpdateProjectPreferenceRequest) {
  return apiRequest(`/projects/${projectId}/preference`, designProjectSchema, {
    method: 'PUT',
    data: body,
  })
}

export function getProjectAssets(projectId: string) {
  return apiRequest(`/projects/${projectId}/assets`, projectAssetsResponseSchema)
}

export function createPage(projectId: string, body: CreatePageRequest) {
  return apiRequest(`/projects/${projectId}/pages`, pageMutationResponseSchema, {
    method: 'POST',
    data: body,
  })
}

export function savePage(projectId: string, pageId: string, body: SavePageRequest) {
  return apiRequest(`/projects/${projectId}/pages/${pageId}`, pageMutationResponseSchema, {
    method: 'PUT',
    data: body,
  })
}

export function duplicatePage(projectId: string, pageId: string) {
  return apiRequest(
    `/projects/${projectId}/pages/${pageId}/duplicate`,
    pageMutationResponseSchema,
    {
      method: 'POST',
    },
  )
}

export function deletePage(projectId: string, pageId: string) {
  return apiRequest(`/projects/${projectId}/pages/${pageId}`, pageDeletionResponseSchema, {
    method: 'DELETE',
  })
}

export function createModule(projectId: string, body: CreatePublicModuleRequest) {
  return apiRequest(`/projects/${projectId}/modules`, publicModuleMutationResponseSchema, {
    method: 'POST',
    data: body,
  })
}

export function saveModule(projectId: string, moduleId: string, body: SavePublicModuleRequest) {
  return apiRequest(
    `/projects/${projectId}/modules/${moduleId}`,
    publicModuleMutationResponseSchema,
    {
      method: 'PUT',
      data: body,
    },
  )
}

export function publishModule(projectId: string, moduleId: string, expectedRevision: number) {
  return apiRequest(
    `/projects/${projectId}/modules/${moduleId}/publish`,
    publicModuleMutationResponseSchema,
    {
      method: 'POST',
      data: { expectedRevision },
    },
  )
}

export function duplicateModule(projectId: string, moduleId: string) {
  return apiRequest(
    `/projects/${projectId}/modules/${moduleId}/duplicate`,
    publicModuleMutationResponseSchema,
    { method: 'POST' },
  )
}

export function deleteModule(projectId: string, moduleId: string) {
  return apiRequest(`/projects/${projectId}/modules/${moduleId}`, designProjectSchema, {
    method: 'DELETE',
  })
}
