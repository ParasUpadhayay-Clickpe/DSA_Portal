import React, { useMemo, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import type { SubAgent } from '@/types/subagents.types';
import styles from './AgentGraph.module.css';

interface GraphNode {
    id: string;
    name: string;
    agent_id: string;
    mob_num: number;
    email?: string;
    status: string;
    depth: number;
    group: number;
}

interface GraphLink {
    source: string;
    target: string;
}

interface AgentGraphProps {
    agents: SubAgent[];
    searchQuery?: string;
    onNodeClick?: (agentId: string) => void;
}

export const AgentGraph: React.FC<AgentGraphProps> = ({ agents, searchQuery = '', onNodeClick }) => {
    // Convert tree structure to nodes and links
    const { nodes, links } = useMemo(() => {
        const nodeMap = new Map<string, GraphNode>();
        const linkList: GraphLink[] = [];

        const processAgent = (agent: SubAgent, parentId?: string) => {
            const nodeId = agent.agent_id;
            const name = [agent.fname, agent.mname, agent.lname].filter(Boolean).join(' ') || agent.name || 'Unknown';

            // Create node
            const node: GraphNode = {
                id: nodeId,
                name,
                agent_id: agent.agent_id,
                mob_num: agent.mob_num,
                email: agent.email,
                status: agent.status,
                depth: agent.depth,
                group: agent.depth,
            };

            nodeMap.set(nodeId, node);

            // Create link to parent if exists
            if (parentId) {
                linkList.push({
                    source: parentId,
                    target: nodeId,
                });
            }

            // Process children
            if (agent.children && agent.children.length > 0) {
                agent.children.forEach((child) => {
                    processAgent(child, nodeId);
                });
            }
        };

        // Process all root agents
        agents.forEach((agent) => {
            processAgent(agent);
        });

        return {
            nodes: Array.from(nodeMap.values()),
            links: linkList,
        };
    }, [agents]);

    // Filter nodes based on search query
    const filteredData = useMemo(() => {
        if (!searchQuery) {
            return { nodes, links };
        }

        const query = searchQuery.toLowerCase();
        const matchingNodeIds = new Set<string>();

        // Find matching nodes
        nodes.forEach((node) => {
            const name = node.name.toLowerCase();
            const agentId = node.agent_id.toLowerCase();
            const mobile = String(node.mob_num).toLowerCase();

            if (name.includes(query) || agentId.includes(query) || mobile.includes(query)) {
                matchingNodeIds.add(node.id);
            }
        });

        // Include all ancestors and descendants of matching nodes
        const includeNodeIds = new Set<string>(matchingNodeIds);

        // Find all ancestors
        const findAncestors = (nodeId: string) => {
            links.forEach((link) => {
                if (link.target === nodeId && !includeNodeIds.has(link.source)) {
                    includeNodeIds.add(link.source);
                    findAncestors(link.source);
                }
            });
        };

        // Find all descendants
        const findDescendants = (nodeId: string) => {
            links.forEach((link) => {
                if (link.source === nodeId && !includeNodeIds.has(link.target)) {
                    includeNodeIds.add(link.target);
                    findDescendants(link.target);
                }
            });
        };

        matchingNodeIds.forEach((nodeId) => {
            findAncestors(nodeId);
            findDescendants(nodeId);
        });

        // Filter nodes and links
        const filteredNodes = nodes.filter((node) => includeNodeIds.has(node.id));
        const filteredLinks = links.filter(
            (link) => includeNodeIds.has(link.source) && includeNodeIds.has(link.target)
        );

        return { nodes: filteredNodes, links: filteredLinks };
    }, [nodes, links, links, searchQuery]);

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'active':
                return '#10b981';
            case 'inactive':
                return '#ef4444';
            default:
                return '#6b7280';
        }
    };

    const handleNodeClick = useCallback(
        (node: GraphNode) => {
            if (onNodeClick) {
                onNodeClick(node.agent_id);
            }
        },
        [onNodeClick]
    );

    const nodeLabel = useCallback((node: GraphNode) => {
        return `<div class="${styles.tooltip}">
            <div class="${styles.tooltipName}">${node.name}</div>
            <div class="${styles.tooltipId}">ID: ${node.agent_id}</div>
            <div class="${styles.tooltipMobile}">Mobile: ${node.mob_num}</div>
            ${node.email ? `<div class="${styles.tooltipEmail}">Email: ${node.email}</div>` : ''}
            <div class="${styles.tooltipStatus}">Status: ${node.status}</div>
        </div>`;
    }, []);

    const nodeColor = useCallback((node: GraphNode) => {
        return getStatusColor(node.status);
    }, []);

    const nodeVal = useCallback((node: GraphNode) => {
        // Size based on depth (root nodes larger)
        return Math.max(8, 20 - node.depth * 2);
    }, []);

    return (
        <div className={styles.graphContainer}>
            <ForceGraph2D
                graphData={filteredData}
                nodeLabel={nodeLabel}
                nodeColor={nodeColor}
                nodeVal={nodeVal}
                linkDirectionalArrowLength={6}
                linkDirectionalArrowRelPos={1}
                linkWidth={2}
                linkColor={() => '#94a3b8'}
                onNodeClick={handleNodeClick}
                nodeCanvasObjectMode={() => 'after'}
                nodeCanvasObject={(node, ctx, globalScale) => {
                    const graphNode = node as GraphNode & { x?: number; y?: number };
                    const label = graphNode.name;
                    const fontSize = 12 / globalScale;
                    ctx.font = `${fontSize}px Sans-Serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = '#374151';
                    ctx.fillText(label, graphNode.x || 0, (graphNode.y || 0) + 20);
                }}
                cooldownTicks={100}
                onEngineStop={() => {
                    // Graph has stabilized
                }}
            />
        </div>
    );
};

