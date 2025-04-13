/**
 * Mock Azure DevOps API Client
 * 
 * This client provides a mock implementation of the Azure DevOps API client
 * for testing and development without requiring an actual ADO API key.
 */

import { ADOWorkItem, ADOWorkItemType, ADOField, ADOProject } from './azuredevops';

export interface ADOComment {
  id: string;
  text: string;
  author: string;
  created: Date;
}

export class MockAzureDevOpsClient {
  private mockData: {
    workItems: Record<string, ADOWorkItem>;
    comments: Record<string, ADOComment[]>;
    relations: Record<string, {parent?: string, children: string[]}>;
    ranks: Record<string, number>;
    workItemTypes: ADOWorkItemType[];
    fields: Record<string, ADOField[]>;
    projects: ADOProject[];
  };

  constructor() {
    this.mockData = this.generateMockData();
  }

  private generateMockData() {
    return {
      workItems: {
        // Epic
        "HCOS-2024/5-173228": {
          id: "HCOS-2024/5-173228",
          rev: 1,
          fields: {
            "System.Title": "Healthcare OS Front Door MVP",
            "System.State": "Active",
            "System.AreaPath": "Healthcare",
            "System.WorkItemType": "Epic",
            "System.CreatedDate": "2025-01-05T08:30:00Z",
            "System.ChangedDate": "2025-03-05T10:45:00Z",
            "System.CreatedBy": "Executive Sponsor",
            "Microsoft.VSTS.Common.ValueArea": "Business"
          },
          url: "https://dev.azure.com/organization/project/_apis/wit/workItems/HCOS-2024/5-173228"
        },
        
        // Features
        "MT217348": {
          id: "MT217348",
          rev: 1,
          fields: {
            "System.Title": "Manage My Profile",
            "System.State": "Active",
            "System.AreaPath": "Healthcare/OS",
            "System.WorkItemType": "Feature",
            "System.CreatedDate": "2025-02-10T09:15:00Z",
            "System.ChangedDate": "2025-03-10T11:30:00Z",
            "System.CreatedBy": "Product Manager",
            "Microsoft.VSTS.Common.ValueArea": "Business"
          },
          url: "https://dev.azure.com/organization/project/_apis/wit/workItems/MT217348",
          relations: [
            {
              rel: "System.LinkTypes.Hierarchy-Reverse",
              url: "https://dev.azure.com/organization/project/_apis/wit/workItems/HCOS-2024/5-173228",
              attributes: {
                name: "Parent"
              }
            },
            {
              rel: "System.LinkTypes.Hierarchy-Forward",
              url: "https://dev.azure.com/organization/project/_apis/wit/workItems/MT217348-1",
              attributes: {
                name: "Child"
              }
            },
            {
              rel: "System.LinkTypes.Hierarchy-Forward",
              url: "https://dev.azure.com/organization/project/_apis/wit/workItems/MT217348-2",
              attributes: {
                name: "Child"
              }
            },
            {
              rel: "System.LinkTypes.Hierarchy-Forward",
              url: "https://dev.azure.com/organization/project/_apis/wit/workItems/MT217348-3",
              attributes: {
                name: "Child"
              }
            },
            {
              rel: "System.LinkTypes.Hierarchy-Forward",
              url: "https://dev.azure.com/organization/project/_apis/wit/workItems/MT217348-4",
              attributes: {
                name: "Child"
              }
            }
          ]
        },
        "MT220257": {
          id: "MT220257",
          rev: 1,
          fields: {
            "System.Title": "Navigate and Access \"Your Products\"",
            "System.State": "Active",
            "System.AreaPath": "Healthcare/OS",
            "System.WorkItemType": "Feature",
            "System.CreatedDate": "2025-02-15T10:20:00Z",
            "System.ChangedDate": "2025-03-12T14:30:00Z",
            "System.CreatedBy": "Product Manager",
            "Microsoft.VSTS.Common.ValueArea": "Business"
          },
          url: "https://dev.azure.com/organization/project/_apis/wit/workItems/MT220257",
          relations: [
            {
              rel: "System.LinkTypes.Hierarchy-Reverse",
              url: "https://dev.azure.com/organization/project/_apis/wit/workItems/HCOS-2024/5-173228",
              attributes: {
                name: "Parent"
              }
            }
          ]
        },
        "MT220414": {
          id: "MT220414",
          rev: 1,
          fields: {
            "System.Title": "CMS Integration & Personalization",
            "System.State": "Active",
            "System.AreaPath": "Healthcare/OS",
            "System.WorkItemType": "Feature",
            "System.CreatedDate": "2025-02-20T11:15:00Z",
            "System.ChangedDate": "2025-03-15T09:45:00Z",
            "System.CreatedBy": "Product Manager",
            "Microsoft.VSTS.Common.ValueArea": "Business"
          },
          url: "https://dev.azure.com/organization/project/_apis/wit/workItems/MT220414",
          relations: [
            {
              rel: "System.LinkTypes.Hierarchy-Reverse",
              url: "https://dev.azure.com/organization/project/_apis/wit/workItems/HCOS-2024/5-173228",
              attributes: {
                name: "Parent"
              }
            }
          ]
        },
        "MT222159": {
          id: "MT222159",
          rev: 1,
          fields: {
            "System.Title": "HC Platform - Develop Inmar Administrative Portal",
            "System.State": "Active",
            "System.AreaPath": "Healthcare/OS",
            "System.WorkItemType": "Feature",
            "System.CreatedDate": "2025-02-25T14:30:00Z",
            "System.ChangedDate": "2025-03-18T16:20:00Z",
            "System.CreatedBy": "Product Manager",
            "Microsoft.VSTS.Common.ValueArea": "Business"
          },
          url: "https://dev.azure.com/organization/project/_apis/wit/workItems/MT222159",
          relations: [
            {
              rel: "System.LinkTypes.Hierarchy-Reverse",
              url: "https://dev.azure.com/organization/project/_apis/wit/workItems/HCOS-2024/5-173228",
              attributes: {
                name: "Parent"
              }
            }
          ]
        },
        
        // User Stories
        "MT217348-1": {
          id: "MT217348-1",
          rev: 1,
          fields: {
            "System.Title": "HC Platform - View Profile Information",
            "System.State": "Closed",
            "System.AreaPath": "Healthcare/OS",
            "System.WorkItemType": "User Story",
            "System.CreatedDate": "2025-03-01T09:30:00Z",
            "System.ChangedDate": "2025-03-20T11:45:00Z",
            "System.CreatedBy": "Chandranath Guha, Sarah",
            "Microsoft.VSTS.Common.ValueArea": "Business",
            "Microsoft.VSTS.Scheduling.StoryPoints": 5,
            "Microsoft.VSTS.Common.Priority": 2,
            "Microsoft.VSTS.Common.Risk": "2",
            "System.Description": "As a healthcare platform user, I need to view my profile information.",
            "Microsoft.VSTS.Common.AcceptanceCriteria": "- User can navigate to profile page\n- User can view all profile fields\n- Profile information is displayed correctly"
          },
          url: "https://dev.azure.com/organization/project/_apis/wit/workItems/MT217348-1",
          relations: [
            {
              rel: "System.LinkTypes.Hierarchy-Reverse",
              url: "https://dev.azure.com/organization/project/_apis/wit/workItems/MT217348",
              attributes: {
                name: "Parent"
              }
            }
          ]
        },
        "MT217348-2": {
          id: "MT217348-2",
          rev: 1,
          fields: {
            "System.Title": "HC Platform - Reflect Updates I Make to My Profile",
            "System.State": "New",
            "System.AreaPath": "Healthcare/OS",
            "System.WorkItemType": "User Story",
            "System.CreatedDate": "2025-03-05T10:15:00Z",
            "System.ChangedDate": "2025-03-05T10:15:00Z",
            "System.CreatedBy": "Chandranath Guha, Sarah",
            "Microsoft.VSTS.Common.ValueArea": "Business",
            "Microsoft.VSTS.Scheduling.StoryPoints": 8,
            "Microsoft.VSTS.Common.Priority": 2,
            "Microsoft.VSTS.Common.Risk": "1",
            "System.Description": "As a healthcare platform user, I need to see updates reflected when I make changes to my profile.",
            "Microsoft.VSTS.Common.AcceptanceCriteria": "- User can edit profile information\n- Changes are saved correctly\n- Updated information is immediately displayed"
          },
          url: "https://dev.azure.com/organization/project/_apis/wit/workItems/MT217348-2",
          relations: [
            {
              rel: "System.LinkTypes.Hierarchy-Reverse",
              url: "https://dev.azure.com/organization/project/_apis/wit/workItems/MT217348",
              attributes: {
                name: "Parent"
              }
            }
          ]
        },
        "MT217348-3": {
          id: "MT217348-3",
          rev: 1,
          fields: {
            "System.Title": "Edit My Profile as an Inmar-Managed User",
            "System.State": "New",
            "System.AreaPath": "Healthcare/OS",
            "System.WorkItemType": "User Story",
            "System.CreatedDate": "2025-03-10T11:30:00Z",
            "System.ChangedDate": "2025-03-10T11:30:00Z",
            "System.CreatedBy": "Chandranath Guha, Sarah",
            "Microsoft.VSTS.Common.ValueArea": "Business",
            "Microsoft.VSTS.Scheduling.StoryPoints": 5,
            "Microsoft.VSTS.Common.Priority": 2,
            "Microsoft.VSTS.Common.Risk": "1",
            "System.Description": "As an Inmar-managed user, I need to edit my profile information.",
            "Microsoft.VSTS.Common.AcceptanceCriteria": "- Inmar-managed user can access profile edit page\n- All editable fields are available\n- Changes are saved correctly"
          },
          url: "https://dev.azure.com/organization/project/_apis/wit/workItems/MT217348-3",
          relations: [
            {
              rel: "System.LinkTypes.Hierarchy-Reverse",
              url: "https://dev.azure.com/organization/project/_apis/wit/workItems/MT217348",
              attributes: {
                name: "Parent"
              }
            }
          ]
        },
        "MT217348-4": {
          id: "MT217348-4",
          rev: 1,
          fields: {
            "System.Title": "Edit My Profile as a Customer-Federated User",
            "System.State": "New",
            "System.AreaPath": "Healthcare/OS",
            "System.WorkItemType": "User Story",
            "System.CreatedDate": "2025-03-15T14:45:00Z",
            "System.ChangedDate": "2025-03-15T14:45:00Z",
            "System.CreatedBy": "Chandranath Guha, Sarah",
            "Microsoft.VSTS.Common.ValueArea": "Business",
            "Microsoft.VSTS.Scheduling.StoryPoints": 8,
            "Microsoft.VSTS.Common.Priority": 2,
            "Microsoft.VSTS.Common.Risk": "2",
            "System.Description": "As a customer-federated user, I need to edit my profile information.",
            "Microsoft.VSTS.Common.AcceptanceCriteria": "- Customer-federated user can access profile edit page\n- Appropriate fields are available for editing\n- Changes are saved correctly\n- Federation-specific fields are handled correctly"
          },
          url: "https://dev.azure.com/organization/project/_apis/wit/workItems/MT217348-4",
          relations: [
            {
              rel: "System.LinkTypes.Hierarchy-Reverse",
              url: "https://dev.azure.com/organization/project/_apis/wit/workItems/MT217348",
              attributes: {
                name: "Parent"
              }
            }
          ]
        },
        
        // User story with ProductBoard link in comments
        "MT221792": {
          id: "MT221792",
          rev: 1,
          fields: {
            "System.Title": "MT220257 - HC Platform - Create get *application* endpoints to expose application data",
            "System.State": "Active",
            "System.AreaPath": "Healthcare/OS",
            "System.WorkItemType": "User Story",
            "System.CreatedDate": "2025-03-15T10:30:00Z",
            "System.ChangedDate": "2025-03-20T14:45:00Z",
            "System.CreatedBy": "Chandranath Guha, Sarah",
            "Microsoft.VSTS.Common.ValueArea": "Business",
            "Microsoft.VSTS.Scheduling.StoryPoints": 8,
            "Microsoft.VSTS.Common.Priority": 2,
            "Microsoft.VSTS.Common.Risk": "2",
            "System.Description": "As a healthcare platform\nI need to expose an api\nIn order to give application data.",
            "Microsoft.VSTS.Common.AcceptanceCriteria": "Scenario - All the gets endpoint needed for the frontend to get user info, their apps and their client relationship.\nGiven: Api is called with valid auth token\nWhen: Get api is called\nThen: Api response is returned\nThen: Api response looks like existing mock apis"
          },
          url: "https://dev.azure.com/organization/project/_apis/wit/workItems/MT221792",
          relations: [
            {
              rel: "System.LinkTypes.Hierarchy-Reverse",
              url: "https://dev.azure.com/organization/project/_apis/wit/workItems/MT220257",
              attributes: {
                name: "Parent"
              }
            }
          ]
        }
      },
      
      // Comments for work items
      comments: {
        "MT221792": [
          {
            id: "c1",
            text: "ProductBoard reference\nhttps://inmar.productboard.com/entity-detail/features/2d9d55af-50bb-4dab-a417-035b11847c53",
            author: "calvin.owens@productboard.com",
            created: new Date("2025-03-25T14:30:00Z")
          }
        ],
        "MT217348-1": [
          {
            id: "c2",
            text: "This story is now complete and has been tested.",
            author: "Chandranath Guha, Sarah",
            created: new Date("2025-03-20T11:45:00Z")
          }
        ]
      },
      
      // Parent-child relationships
      relations: {
        "HCOS-2024/5-173228": { children: ["MT217348", "MT220257", "MT220414", "MT222159"] },
        "MT217348": { parent: "HCOS-2024/5-173228", children: ["MT217348-1", "MT217348-2", "MT217348-3", "MT217348-4"] },
        "MT220257": { parent: "HCOS-2024/5-173228", children: ["MT221792"] },
        "MT220414": { parent: "HCOS-2024/5-173228", children: [] },
        "MT222159": { parent: "HCOS-2024/5-173228", children: [] },
        "MT217348-1": { parent: "MT217348", children: [] },
        "MT217348-2": { parent: "MT217348", children: [] },
        "MT217348-3": { parent: "MT217348", children: [] },
        "MT217348-4": { parent: "MT217348", children: [] },
        "MT221792": { parent: "MT220257", children: [] }
      },
      
      // Work item ranks
      ranks: {
        "MT217348": 1,
        "MT220257": 2,
        "MT220414": 3,
        "MT222159": 4,
        "MT217348-1": 1,
        "MT217348-2": 2,
        "MT217348-3": 3,
        "MT217348-4": 4,
        "MT221792": 1
      },
      
      // Work item types
      workItemTypes: [
        {
          name: "Epic",
          referenceName: "Microsoft.VSTS.WorkItemTypes.Epic",
          description: "Track large initiatives or features",
          color: "purple",
          icon: "icon-epic"
        },
        {
          name: "Feature",
          referenceName: "Microsoft.VSTS.WorkItemTypes.Feature",
          description: "Track specific features or functionality",
          color: "blue",
          icon: "icon-feature"
        },
        {
          name: "User Story",
          referenceName: "Microsoft.VSTS.WorkItemTypes.UserStory",
          description: "Track individual user stories",
          color: "green",
          icon: "icon-story"
        },
        {
          name: "Bug",
          referenceName: "Microsoft.VSTS.WorkItemTypes.Bug",
          description: "Track defects and issues",
          color: "red",
          icon: "icon-bug"
        }
      ],
      
      // Fields
      fields: {
        "Epic": [
          {
            name: "Title",
            referenceName: "System.Title",
            type: "string",
            readOnly: false,
            description: "The title of the work item"
          },
          {
            name: "State",
            referenceName: "System.State",
            type: "string",
            readOnly: false,
            description: "The state of the work item"
          }
        ],
        "Feature": [
          {
            name: "Title",
            referenceName: "System.Title",
            type: "string",
            readOnly: false,
            description: "The title of the work item"
          },
          {
            name: "State",
            referenceName: "System.State",
            type: "string",
            readOnly: false,
            description: "The state of the work item"
          }
        ],
        "User Story": [
          {
            name: "Title",
            referenceName: "System.Title",
            type: "string",
            readOnly: false,
            description: "The title of the work item"
          },
          {
            name: "State",
            referenceName: "System.State",
            type: "string",
            readOnly: false,
            description: "The state of the work item"
          },
          {
            name: "Story Points",
            referenceName: "Microsoft.VSTS.Scheduling.StoryPoints",
            type: "number",
            readOnly: false,
            description: "The estimated size of the story"
          }
        ]
      },
      
      // Projects
      projects: [
        {
          id: "project-1",
          name: "Healthcare OS",
          description: "Healthcare OS Platform",
          url: "https://dev.azure.com/organization/project",
          state: "wellFormed",
          visibility: "private"
        }
      ]
    };
  }

  // Implement interface methods
  async testConnection(): Promise<boolean> {
    return true;
  }

  async getWorkItem(id: string): Promise<ADOWorkItem> {
    const item = this.mockData.workItems[id];
    if (!item) throw new Error(`Work item ${id} not found`);
    return { ...item };
  }

  async getWorkItems(ids: string[]): Promise<ADOWorkItem[]> {
    return ids.map(id => this.mockData.workItems[id]).filter(Boolean);
  }

  async queryWorkItems(query: string): Promise<ADOWorkItem[]> {
    // Simple mock implementation that returns items based on text matching
    const allItems = Object.values(this.mockData.workItems);
    
    if (query.includes("Epic")) {
      return allItems.filter(item => item.fields["System.WorkItemType"] === "Epic");
    } else if (query.includes("Feature")) {
      return allItems.filter(item => item.fields["System.WorkItemType"] === "Feature");
    } else if (query.includes("User Story")) {
      return allItems.filter(item => item.fields["System.WorkItemType"] === "User Story");
    } else if (query.includes("Active")) {
      return allItems.filter(item => item.fields["System.State"] === "Active");
    }
    
    return allItems;
  }

  async getWorkItemsByType(workItemType: string): Promise<ADOWorkItem[]> {
    return Object.values(this.mockData.workItems)
      .filter(item => item.fields["System.WorkItemType"] === workItemType);
  }

  async getWorkItemsUpdatedSince(date: Date): Promise<ADOWorkItem[]> {
    return Object.values(this.mockData.workItems)
      .filter(item => {
        const changedDate = new Date(item.fields["System.ChangedDate"]);
        return changedDate >= date;
      });
  }

  async getChildWorkItems(parentId: string): Promise<ADOWorkItem[]> {
    const relation = this.mockData.relations[parentId];
    if (!relation || !relation.children || relation.children.length === 0) {
      return [];
    }
    
    return this.getWorkItems(relation.children);
  }

  async getParentWorkItem(childId: string): Promise<ADOWorkItem | null> {
    const relation = this.mockData.relations[childId];
    if (!relation || !relation.parent) {
      return null;
    }
    
    return this.getWorkItem(relation.parent);
  }

  async getComments(workItemId: string): Promise<ADOComment[]> {
    return this.mockData.comments[workItemId] || [];
  }

  async addComment(workItemId: string, text: string): Promise<ADOComment> {
    const comment = {
      id: `c${Date.now()}`,
      text,
      author: "Mock User",
      created: new Date()
    };
    
    if (!this.mockData.comments[workItemId]) {
      this.mockData.comments[workItemId] = [];
    }
    
    this.mockData.comments[workItemId].push(comment);
    return comment;
  }

  async getWorkItemRank(id: string): Promise<number> {
    return this.mockData.ranks[id] || 999;
  }

  async updateWorkItemRank(id: string, rank: number): Promise<boolean> {
    this.mockData.ranks[id] = rank;
    return true;
  }

  async reorderWorkItems(ids: string[]): Promise<boolean> {
    // Update ranks based on the order of ids
    ids.forEach((id, index) => {
      this.mockData.ranks[id] = index + 1;
    });
    return true;
  }

  async getProjects(): Promise<ADOProject[]> {
    return [...this.mockData.projects];
  }

  async getWorkItemTypes(): Promise<ADOWorkItemType[]> {
    return [...this.mockData.workItemTypes];
  }

  async getFields(workItemType: string): Promise<ADOField[]> {
    return this.mockData.fields[workItemType] || [];
  }

  async createWorkItem(workItemType: string, fields: Record<string, any>): Promise<ADOWorkItem> {
    const id = `MOCK-${Date.now()}`;
    const workItem: ADOWorkItem = {
      id,
      rev: 1,
      fields: {
        "System.WorkItemType": workItemType,
        "System.CreatedDate": new Date().toISOString(),
        "System.ChangedDate": new Date().toISOString(),
        "System.CreatedBy": "Mock User",
        "System.State": "New",
        ...fields
      },
      url: `https://dev.azure.com/organization/project/_apis/wit/workItems/${id}`
    };
    
    this.mockData.workItems[id] = workItem;
    return workItem;
  }

  async updateWorkItem(id: string, fields: Record<string, any>): Promise<ADOWorkItem> {
    const workItem = this.mockData.workItems[id];
    if (!workItem) {
      throw new Error(`Work item ${id} not found`);
    }
    
    workItem.rev += 1;
    workItem.fields = {
      ...workItem.fields,
      "System.ChangedDate": new Date().toISOString(),
      ...fields
    };
    
    return workItem;
  }

  async createParentChildRelationship(parentId: string, childId: string): Promise<ADOWorkItem> {
    // Update relations
    if (!this.mockData.relations[parentId]) {
      this.mockData.relations[parentId] = { children: [] };
    }
    
    if (!this.mockData.relations[parentId].children.includes(childId)) {
      this.mockData.relations[parentId].children.push(childId);
    }
    
    if (!this.mockData.relations[childId]) {
      this.mockData.relations[childId] = { children: [] };
    }
    
    this.mockData.relations[childId].parent = parentId;
    
    // Update work item relations
    const parentItem = this.mockData.workItems[parentId];
    const childItem = this.mockData.workItems[childId];
    
    if (parentItem && !parentItem.relations) {
      parentItem.relations = [];
    }
    
    if (childItem && !childItem.relations) {
      childItem.relations = [];
    }
    
    if (parentItem && parentItem.relations) {
      const hasRelation = parentItem.relations.some(
        rel => rel.rel === "System.LinkTypes.Hierarchy-Forward" && 
               rel.url.includes(childId)
      );
      
      if (!hasRelation) {
        parentItem.relations.push({
          rel: "System.LinkTypes.Hierarchy-Forward",
          url: `https://dev.azure.com/organization/project/_apis/wit/workItems/${childId}`,
          attributes: {
            name: "Child"
          }
        });
      }
    }
    
    if (childItem && childItem.relations) {
      const hasRelation = childItem.relations.some(
        rel => rel.rel === "System.LinkTypes.Hierarchy-Reverse" && 
               rel.url.includes(parentId)
      );
      
      if (!hasRelation) {
        childItem.relations.push({
          rel: "System.LinkTypes.Hierarchy-Reverse",
          url: `https://dev.azure.com/organization/project/_apis/wit/workItems/${parentId}`,
          attributes: {
            name: "Parent"
          }
        });
      }
    }
    
    return parentItem;
  }
}
