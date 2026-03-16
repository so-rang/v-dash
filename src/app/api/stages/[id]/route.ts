/**
 * 개별 Stage API Route
 * GET: Stage 상세 조회
 * PATCH: Stage 수정 (제목 동기화, Vivid 전환 등)
 * DELETE: Soft Delete (deleted_at 기록)
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const stage = await prisma.productionStage.findUnique({
            where: { id },
            include: {
                details: true,
                owner: {
                    select: { id: true, displayName: true, avatarUrl: true },
                },
                channel: {
                    select: { displayName: true, personaConfig: true },
                },
            },
        });

        if (!stage) {
            return NextResponse.json({ error: 'Stage not found' }, { status: 404 });
        }

        return NextResponse.json(stage);
    } catch (error) {
        console.error('[API] Stage detail error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch stage' },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const body = await request.json();
        const { title, vividStatus, currentTab, ownerId, scheduledDate, details } = body;

        // Stage 업데이트
        const updateData: Record<string, unknown> = {};
        if (title !== undefined) updateData.title = title;
        if (vividStatus !== undefined) updateData.vividStatus = vividStatus;
        if (currentTab !== undefined) updateData.currentTab = currentTab;
        if (ownerId !== undefined) updateData.ownerId = ownerId;
        if (scheduledDate !== undefined) updateData.scheduledDate = new Date(scheduledDate);

        const stage = await prisma.productionStage.update({
            where: { id },
            data: updateData,
            include: { details: true },
        });

        // StageDetail 업데이트 (있을 경우)
        if (details && stage.details) {
            await prisma.stageDetail.update({
                where: { id: stage.details.id },
                data: details,
            });
        }

        return NextResponse.json(stage);
    } catch (error) {
        console.error('[API] Stage update error:', error);
        return NextResponse.json(
            { error: 'Failed to update stage' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        // Soft Delete: deleted_at 타임스탬프 기록
        const stage = await prisma.productionStage.update({
            where: { id },
            data: { deletedAt: new Date() },
        });

        return NextResponse.json({
            message: 'Stage soft-deleted',
            deletedAt: stage.deletedAt,
        });
    } catch (error) {
        console.error('[API] Stage delete error:', error);
        return NextResponse.json(
            { error: 'Failed to delete stage' },
            { status: 500 }
        );
    }
}
