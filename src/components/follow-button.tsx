'use client';

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Star } from "lucide-react";

interface FollowButtonProps {
    channelName: string;
}

export function FollowButton({ channelName }: FollowButtonProps) {
    const { toast } = useToast();

    const handleFollow = () => {
        toast({
            title: "Following Channel",
            description: `You are now following ${channelName}.`,
        });
    };

    return (
        <Button variant="outline" onClick={handleFollow}>
            <Star className="mr-2 h-4 w-4" /> Follow
        </Button>
    );
}
