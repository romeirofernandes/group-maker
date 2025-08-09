import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiPlus,
  FiX,
  FiUsers,
  FiShuffle,
  FiSettings,
  FiMinus,
} from "react-icons/fi";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toaster, toast } from "sonner";

const App = () => {
  const [names, setNames] = useState([]);
  const [currentName, setCurrentName] = useState("");
  const [groupSize, setGroupSize] = useState(2);
  const [restrictions, setRestrictions] = useState([]);
  const [currentRestriction, setCurrentRestriction] = useState({
    person1: "",
    person2: "",
  });
  const [groups, setGroups] = useState([]);
  const [showRestrictions, setShowRestrictions] = useState(false);

  const groupsRef = useRef(null);

  const canGenerateGroups = useMemo(() => {
    return names.length >= 2 && names.length % groupSize === 0;
  }, [names.length, groupSize]);

  const maxGroupSize = useMemo(() => {
    return Math.floor(names.length / 2) || 2;
  }, [names.length]);

  const possibleGroups = useMemo(() => {
    return names.length > 0 ? Math.floor(names.length / groupSize) : 0;
  }, [names.length, groupSize]);

  const missingNames = useMemo(() => {
    if (names.length === 0) return 0;
    const remainder = names.length % groupSize;
    return remainder === 0 ? 0 : groupSize - remainder;
  }, [names.length, groupSize]);

  const availableNamesForPerson1 = useMemo(() => {
    return names.filter((name) => name !== currentRestriction.person2);
  }, [names, currentRestriction.person2]);

  const availableNamesForPerson2 = useMemo(() => {
    return names.filter((name) => name !== currentRestriction.person1);
  }, [names, currentRestriction.person1]);

  const addName = useCallback(() => {
    const trimmedName = currentName.trim().toLowerCase();
    if (trimmedName && !names.includes(trimmedName)) {
      setNames((prev) => [...prev, trimmedName]);
      setCurrentName("");
    }
  }, [currentName, names]);

  const removeName = useCallback((nameToRemove) => {
    setNames((prev) => prev.filter((name) => name !== nameToRemove));
    setRestrictions((prev) =>
      prev.filter(
        (r) => r.person1 !== nameToRemove && r.person2 !== nameToRemove
      )
    );
    setCurrentRestriction((prev) => ({
      person1: prev.person1 === nameToRemove ? "" : prev.person1,
      person2: prev.person2 === nameToRemove ? "" : prev.person2,
    }));
  }, []);

  const addRestriction = useCallback(() => {
    const { person1, person2 } = currentRestriction;
    if (!person1 || !person2) return;
    if (!names.includes(person1) || !names.includes(person2)) return;
    if (person1 === person2) return;

    const newRestriction = { person1, person2 };
    const exists = restrictions.some(
      (r) =>
        (r.person1 === person1 && r.person2 === person2) ||
        (r.person1 === person2 && r.person2 === person1)
    );

    if (!exists) {
      setRestrictions((prev) => [...prev, newRestriction]);
      setCurrentRestriction({ person1: "", person2: "" });
    }
  }, [currentRestriction, names, restrictions]);

  const removeRestriction = useCallback((index) => {
    setRestrictions((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const generateGroups = useCallback(() => {
    if (!canGenerateGroups) return;

    if (
      names.length === 2 &&
      groupSize === 2 &&
      restrictions.some(
        (r) =>
          (r.person1 === names[0] && r.person2 === names[1]) ||
          (r.person1 === names[1] && r.person2 === names[0])
      )
    ) {
      toast.error("Cannot generate groups: restrictions make it impossible.");
      return;
    }

    let attempts = 0;
    const maxAttempts = 100;
    let bestGroups = [];
    let bestViolations = Infinity;

    while (attempts < maxAttempts) {
      const shuffled = [...names].sort(() => Math.random() - 0.5);
      const newGroups = [];
      let violations = 0;

      for (let i = 0; i < shuffled.length; i += groupSize) {
        const group = shuffled.slice(i, i + groupSize);
        const groupViolations = restrictions.filter(
          (r) => group.includes(r.person1) && group.includes(r.person2)
        ).length;

        violations += groupViolations;
        newGroups.push(group);
      }

      if (violations < bestViolations) {
        bestViolations = violations;
        bestGroups = newGroups;
      }

      if (violations === 0) break;

      attempts++;
    }

    setGroups(bestGroups);

    setTimeout(() => {
      groupsRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, [names, groupSize, restrictions, canGenerateGroups]);

  const incrementGroupSize = useCallback(() => {
    setGroupSize((prev) => Math.min(prev + 1, maxGroupSize));
  }, [maxGroupSize]);

  const decrementGroupSize = useCallback(() => {
    setGroupSize((prev) => Math.max(prev - 1, 2));
  }, []);

  useEffect(() => {
    if (groups.length > 0) {
      setGroups([]);
    }
  }, [names, restrictions, groupSize]);

  const canAddRestriction = useMemo(() => {
    const { person1, person2 } = currentRestriction;
    return (
      person1 &&
      person2 &&
      person1 !== person2 &&
      names.includes(person1) &&
      names.includes(person2) &&
      !restrictions.some(
        (r) =>
          (r.person1 === person1 && r.person2 === person2) ||
          (r.person1 === person2 && r.person2 === person1)
      )
    );
  }, [currentRestriction, names, restrictions]);

  return (
    <div className="min-h-screen bg-background text-foreground p-4">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#262626",
            color: "#f5f5f7",
            border: "1px solid #404040", 
            borderRadius: "3px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          },
        }}
      />
      <div className="mx-auto max-w-3xl space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <h1 className="text-4xl md:text-5xl mt-8 font-bold tracking-tight">
            f*ck groups.
          </h1>
          <p className="text-muted-foreground text-lg">
            there's always someone that gets left out.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FiUsers className="w-5 h-5" />
                add your victims
              </CardTitle>
              <CardDescription>
                throw in some names and let chaos decide their fate
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="enter a name..."
                  value={currentName}
                  onChange={(e) => setCurrentName(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addName()}
                  className="flex-1"
                />
                <Button
                  onClick={addName}
                  size="icon"
                  disabled={!currentName.trim()}
                >
                  <FiPlus className="w-4 h-4" />
                </Button>
              </div>

              {names.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-wrap gap-2"
                >
                  <AnimatePresence mode="popLayout">
                    {names.map((name, index) => (
                      <motion.div
                        key={name}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ delay: Math.min(index * 0.03, 0.3) }}
                        layout
                      >
                        <Badge
                          variant="secondary"
                          className="text-sm py-1 px-3"
                        >
                          {name}
                          <button
                            onClick={() => removeName(name)}
                            className="ml-2 hover:text-destructive transition-colors"
                          >
                            <FiX className="w-3 h-3" />
                          </button>
                        </Badge>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {names.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FiSettings className="w-5 h-5" />
                  group configuration
                </CardTitle>
                <CardDescription>
                  set group size and optional restrictions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">group size:</label>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={decrementGroupSize}
                      disabled={groupSize <= 2}
                      className="h-8 w-8"
                    >
                      <FiMinus className="w-3 h-3" />
                    </Button>
                    <div className="flex items-center justify-center min-w-16 h-8 px-3 rounded-md border bg-background text-sm font-medium">
                      {groupSize}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={incrementGroupSize}
                      disabled={groupSize >= maxGroupSize}
                      className="h-8 w-8"
                    >
                      <FiPlus className="w-3 h-3" />
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      ({possibleGroups} groups possible)
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowRestrictions(!showRestrictions)}
                    className="w-full"
                    disabled={names.length < 2}
                  >
                    {showRestrictions ? "hide" : "add"} restrictions
                  </Button>

                  <AnimatePresence>
                    {showRestrictions && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-3 pt-2 overflow-hidden"
                      >
                        <div className="flex gap-2">
                          <Select
                            value={currentRestriction.person1}
                            onValueChange={(value) =>
                              setCurrentRestriction({
                                ...currentRestriction,
                                person1: value,
                              })
                            }
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue
                                placeholder={
                                  window.innerWidth <= 768
                                    ? "person 1"
                                    : "select person 1..."
                                }
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {availableNamesForPerson1.map((name) => (
                                <SelectItem key={name} value={name}>
                                  {name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <span className="flex items-center text-muted-foreground">
                            ≠
                          </span>

                          <Select
                            value={currentRestriction.person2}
                            onValueChange={(value) =>
                              setCurrentRestriction({
                                ...currentRestriction,
                                person2: value,
                              })
                            }
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue
                                placeholder={
                                  window.innerWidth <= 768
                                    ? "person 2"
                                    : "select person 2..."
                                }
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {availableNamesForPerson2.map((name) => (
                                <SelectItem key={name} value={name}>
                                  {name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Button
                            onClick={addRestriction}
                            size="icon"
                            variant="outline"
                            disabled={!canAddRestriction}
                          >
                            <FiPlus className="w-4 h-4" />
                          </Button>
                        </div>

                        {restrictions.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">
                              restrictions:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              <AnimatePresence mode="popLayout">
                                {restrictions.map((restriction, index) => (
                                  <motion.div
                                    key={`${restriction.person1}-${restriction.person2}`}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    layout
                                  >
                                    <Badge variant="destructive">
                                      {restriction.person1} ≠{" "}
                                      {restriction.person2}
                                      <button
                                        onClick={() => removeRestriction(index)}
                                        className="ml-2 hover:text-destructive-foreground/70 transition-colors"
                                      >
                                        <FiX className="w-3 h-3" />
                                      </button>
                                    </Badge>
                                  </motion.div>
                                ))}
                              </AnimatePresence>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {names.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex justify-center"
          >
            <Button
              onClick={generateGroups}
              disabled={!canGenerateGroups}
              size="lg"
              className="text-lg px-8"
            >
              <FiShuffle className="w-5 h-5 mr-2" />
              {canGenerateGroups
                ? "generate groups"
                : missingNames > 0
                ? `need ${missingNames} more names`
                : "add more names"}
            </Button>
          </motion.div>
        )}

        <AnimatePresence>
          {groups.length > 0 && (
            <motion.div
              ref={groupsRef}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              className="space-y-4"
            >
              <h2 className="text-2xl font-bold text-center">
                your groups are ready
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                <AnimatePresence mode="popLayout">
                  {groups.map((group, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: Math.min(index * 0.05, 0.2) }}
                      layout
                    >
                      <Card className="border-primary/20">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg">
                            group {index + 1}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2">
                            {group.map((member, memberIndex) => (
                              <motion.div
                                key={member}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{
                                  delay: Math.min(
                                    index * 0.05 + memberIndex * 0.02,
                                    0.3
                                  ),
                                }}
                              >
                                <Badge
                                  variant="outline"
                                  className="text-sm py-1"
                                >
                                  {member}
                                </Badge>
                              </motion.div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <div className="flex justify-center">
                <Button onClick={generateGroups} variant="outline">
                  <FiShuffle className="w-4 h-4 mr-2" />
                  shuffle again
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default App;
