import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { errorHandler, ApiError } from "@/lib/errors/handler";
import { z } from "zod";

const pantryUpdateSchema = z.object({
    quantity: z.number().nullable().optional(),
    unit: z.string().nullable().optional(),
    name: z.string().nullable().optional(),
});

/**
 * PATCH /api/meals/pantry/[id]
 * Update a specific pantry item.
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { user, error: authError } = await getUser();
        if (authError || !user) throw new ApiError(401, "Unauthorized");

        const body = await request.json();
        const { quantity, unit, name } = pantryUpdateSchema.parse(body);
        const { id } = await params;

        const supabase = await createClient();

        // Verify ownership and update
        const { data, error } = await supabase
            .from("pantry_items")
            .update({
                quantity,
                unit,
                nickname: name,
                last_updated: new Date().toISOString(),
            })
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;
        if (!data) throw new ApiError(404, "Pantry item not found");

        return NextResponse.json({ success: true, data });

    } catch (error) {
        return errorHandler(error, { route: `/api/meals/pantry/[id]`, method: "PATCH" });
    }
}

/**
 * DELETE /api/meals/pantry/[id]
 * Delete a specific pantry item.
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { user, error: authError } = await getUser();
        if (authError || !user) throw new ApiError(401, "Unauthorized");

        const { id } = await params;
        const supabase = await createClient();

        const { error } = await supabase
            .from("pantry_items")
            .delete()
            .eq("id", id);

        if (error) throw error;

        return NextResponse.json({ success: true });

    } catch (error) {
        return errorHandler(error, { route: `/api/meals/pantry/[id]`, method: "DELETE" });
    }
}
