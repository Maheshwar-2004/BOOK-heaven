import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";

interface BookCardProps {
  id: string;
  title: string;
  author: string;
  genre: string;
  publishedYear: number;
  averageRating?: number;
  reviewCount?: number;
}

const BookCard = ({
  id,
  title,
  author,
  genre,
  publishedYear,
  averageRating = 0,
  reviewCount = 0,
}: BookCardProps) => {
  return (
    <Link to={`/book/${id}`} className="block group">
      <Card className="h-full transition-all duration-300 hover:shadow-[var(--shadow-hover)] border-border overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-primary to-accent" />
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-bold text-lg leading-tight line-clamp-2 group-hover:text-accent transition-colors">
              {title}
            </h3>
            <Badge variant="secondary" className="shrink-0 text-xs">
              {genre}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">{author}</p>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-accent text-accent" />
              <span className="font-medium">
                {averageRating > 0 ? averageRating.toFixed(1) : "No ratings"}
              </span>
            </div>
            <span className="text-muted-foreground">
              {reviewCount} {reviewCount === 1 ? "review" : "reviews"}
            </span>
          </div>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">Published {publishedYear}</p>
        </CardFooter>
      </Card>
    </Link>
  );
};

export default BookCard;