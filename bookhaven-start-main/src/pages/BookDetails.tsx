import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, Edit, Trash2, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  reviewText: z.string().trim().min(10, "Review must be at least 10 characters").max(1000, "Review must be less than 1000 characters"),
});

const BookDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [book, setBook] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [rating, setRating] = useState("5");
  const [reviewText, setReviewText] = useState("");
  const [editingReview, setEditingReview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const setupAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };

    setupAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (id) {
      fetchBookDetails();
    }
  }, [id]);

  const fetchBookDetails = async () => {
    setIsLoading(true);
    try {
      const { data: bookData, error: bookError } = await supabase
        .from("books")
        .select("*, profiles(name)")
        .eq("id", id)
        .single();

      if (bookError) throw bookError;
      setBook(bookData);

      const { data: reviewsData, error: reviewsError } = await supabase
        .from("reviews")
        .select("*, profiles(name)")
        .eq("book_id", id)
        .order("created_at", { ascending: false });

      if (reviewsError) throw reviewsError;
      setReviews(reviewsData);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch book details",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to submit a review",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    setIsSubmitting(true);
    try {
      const validated = reviewSchema.parse({
        rating: parseInt(rating),
        reviewText,
      });

      if (editingReview) {
        const { error } = await supabase
          .from("reviews")
          .update({
            rating: validated.rating,
            review_text: validated.reviewText,
          })
          .eq("id", editingReview);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Review updated successfully",
        });
        setEditingReview(null);
      } else {
        const { error } = await supabase.from("reviews").insert({
          book_id: id,
          user_id: user.id,
          rating: validated.rating,
          review_text: validated.reviewText,
        });

        if (error) throw error;

        toast({
          title: "Success",
          description: "Review submitted successfully",
        });
      }

      setRating("5");
      setReviewText("");
      fetchBookDetails();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to submit review",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditReview = (review: any) => {
    setEditingReview(review.id);
    setRating(review.rating.toString());
    setReviewText(review.review_text);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteReview = async (reviewId: string) => {
    try {
      const { error } = await supabase.from("reviews").delete().eq("id", reviewId);
      if (error) throw error;

      toast({
        title: "Success",
        description: "Review deleted successfully",
      });
      fetchBookDetails();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete review",
        variant: "destructive",
      });
    }
  };

  const handleDeleteBook = async () => {
    if (!window.confirm("Are you sure you want to delete this book?")) return;

    try {
      const { error } = await supabase.from("books").delete().eq("id", id);
      if (error) throw error;

      toast({
        title: "Success",
        description: "Book deleted successfully",
      });
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete book",
        variant: "destructive",
      });
    }
  };

  const averageRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : "0.0";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
        <Navbar user={user} />
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
        <Navbar user={user} />
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">Book not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      <Navbar user={user} />

      <div className="container mx-auto px-4 py-8">
        <Button variant="outline" onClick={() => navigate("/")} className="mb-6">
          ← Back to Books
        </Button>

        {/* Book Details */}
        <Card className="mb-8 shadow-[var(--shadow-book)]">
          <div className="h-2 bg-gradient-to-r from-primary to-accent" />
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-4xl font-bold mb-2">{book.title}</h1>
                    <p className="text-xl text-muted-foreground mb-2">by {book.author}</p>
                    <div className="flex items-center gap-2 mb-4">
                      <Badge variant="secondary">{book.genre}</Badge>
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {book.published_year}
                      </span>
                    </div>
                  </div>
                  {user && user.id === book.added_by && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/edit-book/${book.id}`)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={handleDeleteBook}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                <p className="text-lg leading-relaxed mb-6">{book.description}</p>

                <div className="flex items-center gap-6 p-4 bg-secondary/50 rounded-lg">
                  <div className="text-center">
                    <div className="flex items-center gap-1 text-2xl font-bold mb-1">
                      <Star className="h-6 w-6 fill-accent text-accent" />
                      {averageRating}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
                    </p>
                  </div>
                  {book.profiles && (
                    <div className="border-l border-border pl-6">
                      <p className="text-sm text-muted-foreground">Added by</p>
                      <p className="font-medium">{book.profiles.name}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add/Edit Review */}
        {user && (
          <Card className="mb-8 shadow-[var(--shadow-book)]">
            <CardHeader>
              <CardTitle>
                {editingReview ? "Edit Your Review" : "Write a Review"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Rating</label>
                <Select value={rating} onValueChange={setRating}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[5, 4, 3, 2, 1].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        <div className="flex items-center gap-1">
                          {num} <Star className="h-4 w-4 fill-accent text-accent" />
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Your Review</label>
                <Textarea
                  placeholder="Share your thoughts about this book..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  rows={4}
                  maxLength={1000}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {reviewText.length}/1000 characters
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleSubmitReview}
                  disabled={isSubmitting || !reviewText.trim()}
                  className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
                >
                  {isSubmitting
                    ? "Submitting..."
                    : editingReview
                    ? "Update Review"
                    : "Submit Review"}
                </Button>
                {editingReview && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingReview(null);
                      setRating("5");
                      setReviewText("");
                    }}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reviews List */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Reviews</h2>
          {reviews.length > 0 ? (
            reviews.map((review) => (
              <Card key={review.id} className="shadow-[var(--shadow-book)]">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold">{review.profiles?.name || "Anonymous"}</p>
                      <div className="flex items-center gap-1 mt-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < review.rating
                                ? "fill-accent text-accent"
                                : "text-muted-foreground"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    {user && user.id === review.user_id && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditReview(review)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteReview(review.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <p className="text-foreground leading-relaxed">{review.review_text}</p>
                  <p className="text-xs text-muted-foreground mt-3">
                    {new Date(review.created_at).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No reviews yet. Be the first to review this book!
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookDetails;