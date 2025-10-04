import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const bookSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  author: z.string().trim().min(1, "Author is required").max(100, "Author must be less than 100 characters"),
  description: z.string().trim().min(10, "Description must be at least 10 characters").max(2000, "Description must be less than 2000 characters"),
  genre: z.string().trim().min(1, "Genre is required").max(50, "Genre must be less than 50 characters"),
  publishedYear: z.number().min(1000, "Invalid year").max(new Date().getFullYear() + 1, "Year cannot be in the future"),
});

const AddBook = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingBook, setIsLoadingBook] = useState(false);
  
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [description, setDescription] = useState("");
  const [genre, setGenre] = useState("");
  const [publishedYear, setPublishedYear] = useState("");

  useEffect(() => {
    const setupAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication Required",
          description: "Please log in to add books",
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
    if (id && user) {
      fetchBook();
    }
  }, [id, user]);

  const fetchBook = async () => {
    setIsLoadingBook(true);
    try {
      const { data, error } = await supabase
        .from("books")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      if (data.added_by !== user?.id) {
        toast({
          title: "Access Denied",
          description: "You can only edit books you added",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      setTitle(data.title);
      setAuthor(data.author);
      setDescription(data.description);
      setGenre(data.genre);
      setPublishedYear(data.published_year.toString());
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch book details",
        variant: "destructive",
      });
      navigate("/");
    } finally {
      setIsLoadingBook(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    try {
      const validated = bookSchema.parse({
        title,
        author,
        description,
        genre,
        publishedYear: parseInt(publishedYear),
      });

      if (id) {
        const { error } = await supabase
          .from("books")
          .update({
            title: validated.title,
            author: validated.author,
            description: validated.description,
            genre: validated.genre,
            published_year: validated.publishedYear,
          })
          .eq("id", id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Book updated successfully",
        });
        navigate(`/book/${id}`);
      } else {
        const { data, error } = await supabase
          .from("books")
          .insert({
            title: validated.title,
            author: validated.author,
            description: validated.description,
            genre: validated.genre,
            published_year: validated.publishedYear,
            added_by: user.id,
          })
          .select()
          .single();

        if (error) throw error;

        toast({
          title: "Success",
          description: "Book added successfully",
        });
        navigate(`/book/${data.id}`);
      }
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
          description: error.message || "Failed to save book",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingBook) {
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

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Button variant="outline" onClick={() => navigate("/")} className="mb-6">
          ← Back
        </Button>

        <Card className="shadow-[var(--shadow-book)]">
          <div className="h-2 bg-gradient-to-r from-primary to-accent" />
          <CardHeader>
            <CardTitle className="text-3xl">
              {id ? "Edit Book" : "Add New Book"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter book title"
                  required
                  maxLength={200}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="author">Author *</Label>
                <Input
                  id="author"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Enter author name"
                  required
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter book description"
                  required
                  rows={5}
                  maxLength={2000}
                />
                <p className="text-xs text-muted-foreground">
                  {description.length}/2000 characters
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="genre">Genre *</Label>
                  <Input
                    id="genre"
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    placeholder="e.g. Fiction, Mystery"
                    required
                    maxLength={50}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="year">Published Year *</Label>
                  <Input
                    id="year"
                    type="number"
                    value={publishedYear}
                    onChange={(e) => setPublishedYear(e.target.value)}
                    placeholder="e.g. 2020"
                    required
                    min="1000"
                    max={new Date().getFullYear() + 1}
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
                >
                  {isLoading ? "Saving..." : id ? "Update Book" : "Add Book"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/")}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddBook;