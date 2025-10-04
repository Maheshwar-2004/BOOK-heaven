import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import BookCard from "@/components/BookCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, MessageSquare, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [userBooks, setUserBooks] = useState<any[]>([]);
  const [userReviews, setUserReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const setupAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication Required",
          description: "Please log in to view your profile",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }
      setUser(session.user);
    };

    setupAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!session) {
          navigate("/auth");
        }
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  useEffect(() => {
    if (user) {
      fetchProfileData();
    }
  }, [user]);

  const fetchProfileData = async () => {
    setIsLoading(true);
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch user's books
      const { data: booksData, error: booksError } = await supabase
        .from("books")
        .select("*")
        .eq("added_by", user.id)
        .order("created_at", { ascending: false });

      if (booksError) throw booksError;

      // Fetch reviews for books calculation
      const { data: reviewsData, error: reviewsError } = await supabase
        .from("reviews")
        .select("book_id, rating");

      if (reviewsError) throw reviewsError;

      // Calculate average ratings for books
      const booksWithRatings = booksData.map((book) => {
        const bookReviews = reviewsData.filter((r) => r.book_id === book.id);
        const avgRating =
          bookReviews.length > 0
            ? bookReviews.reduce((sum, r) => sum + r.rating, 0) / bookReviews.length
            : 0;
        return {
          ...book,
          averageRating: avgRating,
          reviewCount: bookReviews.length,
        };
      });

      setUserBooks(booksWithRatings);

      // Fetch user's reviews
      const { data: userReviewsData, error: userReviewsError } = await supabase
        .from("reviews")
        .select("*, books(title, author)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (userReviewsError) throw userReviewsError;
      setUserReviews(userReviewsData);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch profile data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      <Navbar user={user} />

      <div className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <Card className="mb-8 shadow-[var(--shadow-book)]">
          <div className="h-2 bg-gradient-to-r from-primary to-accent" />
          <CardContent className="p-8">
            <div className="flex items-center gap-6">
              <div className="p-4 rounded-full bg-gradient-to-br from-primary to-accent">
                <User className="h-12 w-12 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-1">{profile?.name}</h1>
                <p className="text-muted-foreground">{profile?.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
              <Card className="bg-secondary/50">
                <CardContent className="p-4 text-center">
                  <BookOpen className="h-8 w-8 mx-auto mb-2 text-accent" />
                  <p className="text-2xl font-bold">{userBooks.length}</p>
                  <p className="text-sm text-muted-foreground">Books Added</p>
                </CardContent>
              </Card>
              <Card className="bg-secondary/50">
                <CardContent className="p-4 text-center">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 text-accent" />
                  <p className="text-2xl font-bold">{userReviews.length}</p>
                  <p className="text-sm text-muted-foreground">Reviews Written</p>
                </CardContent>
              </Card>
              <Card className="bg-secondary/50">
                <CardContent className="p-4 text-center">
                  <User className="h-8 w-8 mx-auto mb-2 text-accent" />
                  <p className="text-2xl font-bold">Member</p>
                  <p className="text-sm text-muted-foreground">
                    Since {new Date(profile?.created_at).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="books" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md mb-6">
            <TabsTrigger value="books">My Books</TabsTrigger>
            <TabsTrigger value="reviews">My Reviews</TabsTrigger>
          </TabsList>

          <TabsContent value="books">
            {userBooks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userBooks.map((book) => (
                  <BookCard
                    key={book.id}
                    id={book.id}
                    title={book.title}
                    author={book.author}
                    genre={book.genre}
                    publishedYear={book.published_year}
                    averageRating={book.averageRating}
                    reviewCount={book.reviewCount}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  You haven't added any books yet.
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="reviews">
            {userReviews.length > 0 ? (
              <div className="space-y-4">
                {userReviews.map((review) => (
                  <Card key={review.id} className="shadow-[var(--shadow-book)]">
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {review.books?.title}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        by {review.books?.author}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-1 mb-2">
                        {Array.from({ length: review.rating }).map((_, i) => (
                          <span key={i} className="text-accent">★</span>
                        ))}
                      </div>
                      <p className="text-foreground leading-relaxed">{review.review_text}</p>
                      <p className="text-xs text-muted-foreground mt-3">
                        {new Date(review.created_at).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  You haven't written any reviews yet.
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;