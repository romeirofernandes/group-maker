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
  FiChevronLeft,
  FiChevronRight,
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
  const [allCombinations, setAllCombinations] = useState([]);
  const [currentCombinationIndex, setCombinationIndex] = useState(0);
  const [showRestrictions, setShowRestrictions] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

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
    if (!currentRestriction.person1) return [];
    return names.filter((name) => {
      if (name === currentRestriction.person1) return false;
      const pairExists = restrictions.some(
        (r) =>
          (r.person1 === currentRestriction.person1 && r.person2 === name) ||
          (r.person1 === name && r.person2 === currentRestriction.person1)
      );
      return !pairExists;
    });
  }, [names, currentRestriction.person1, restrictions]);

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

  useEffect(() => {
    const { person1, person2 } = currentRestriction;
    if (person1 && person2 && person1 !== person2) {
      const exists = restrictions.some(
        (r) =>
          (r.person1 === person1 && r.person2 === person2) ||
          (r.person1 === person2 && r.person2 === person1)
      );
      if (!exists) {
        setRestrictions((prev) => [...prev, { person1, person2 }]);
        setCurrentRestriction({ person1: "", person2: "" });
      }
    }
  }, [currentRestriction, restrictions]);

  const removeRestriction = useCallback((index) => {
    setRestrictions((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const generateAllCombinations = useCallback(() => {
    if (!canGenerateGroups) return;

    setIsGenerating(true);

    setTimeout(() => {
      const namesList = [...names];
      const combinations = [];
      const maxCombinations = 1000;

      function generateGroupCombinations(people, groupSize) {
        if (people.length === 0) return [[]];
        if (people.length % groupSize !== 0) return [];

        const result = [];
        const firstPerson = people[0];
        const remainingPeople = people.slice(1);

        function getCombinations(arr, size) {
          if (size === 1) return arr.map((item) => [item]);
          if (size > arr.length) return [];
          const combinations = [];
          for (let i = 0; i <= arr.length - size; i++) {
            const head = arr[i];
            const tailCombinations = getCombinations(
              arr.slice(i + 1),
              size - 1
            );
            tailCombinations.forEach((tail) =>
              combinations.push([head, ...tail])
            );
          }
          return combinations;
        }

        const possibleGroupmates = getCombinations(
          remainingPeople,
          groupSize - 1
        );

        for (const groupmates of possibleGroupmates) {
          const currentGroup = [firstPerson, ...groupmates].sort();
          const leftoverPeople = remainingPeople.filter(
            (person) => !groupmates.includes(person)
          );
          const remainingCombinations = generateGroupCombinations(
            leftoverPeople,
            groupSize
          );
          for (const remainingGroups of remainingCombinations) {
            const fullCombination = [currentGroup, ...remainingGroups].sort(
              (a, b) => {
                return a[0].localeCompare(b[0]);
              }
            );
            result.push(fullCombination);
          }
        }

        return result;
      }

      function hasViolations(groups) {
        return restrictions.some((restriction) =>
          groups.some(
            (group) =>
              group.includes(restriction.person1) &&
              group.includes(restriction.person2)
          )
        );
      }

      const allCombinations = generateGroupCombinations(
        namesList.sort(),
        groupSize
      );
      const validCombinations = allCombinations
        .filter((combination) => !hasViolations(combination))
        .slice(0, maxCombinations);

      if (allCombinations.length > maxCombinations) {
        toast.warning(
          `Limited to ${maxCombinations} combinations to prevent browser freeze. Found ${allCombinations.length} total.`
        );
      }

      if (validCombinations.length === 0) {
        toast.error("No valid combinations found with current restrictions.");
        setAllCombinations([]);
      } else {
        setAllCombinations(validCombinations);
        setCombinationIndex(0);
        toast.success(
          `Found ${validCombinations.length} valid combination${
            validCombinations.length !== 1 ? "s" : ""
          }!`
        );

        setTimeout(() => {
          groupsRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }

      setIsGenerating(false);
    }, 100);
  }, [names, groupSize, restrictions, canGenerateGroups]);

  const incrementGroupSize = useCallback(() => {
    setGroupSize((prev) => Math.min(prev + 1, maxGroupSize));
  }, [maxGroupSize]);

  const decrementGroupSize = useCallback(() => {
    setGroupSize((prev) => Math.max(prev - 1, 2));
  }, []);

  useEffect(() => {
    if (allCombinations.length > 0) {
      setAllCombinations([]);
      setCombinationIndex(0);
    }
  }, [names, restrictions, groupSize]);

  const currentGroups = allCombinations[currentCombinationIndex] || [];

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
                                person1: value,
                                person2: "",
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
                            disabled={!currentRestriction.person1}
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue
                                placeholder={
                                  !currentRestriction.person1
                                    ? "select person 1"
                                    : availableNamesForPerson2.length === 0
                                    ? "no valid pairs"
                                    : window.innerWidth <= 768
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
              onClick={generateAllCombinations}
              disabled={!canGenerateGroups || isGenerating}
              size="lg"
              className="text-lg px-8"
            >
              <FiShuffle className="w-5 h-5 mr-2" />
              {isGenerating
                ? "generating..."
                : canGenerateGroups
                ? "generate all combinations"
                : missingNames > 0
                ? `need ${missingNames} more names`
                : "add more names"}
            </Button>
          </motion.div>
        )}

        <AnimatePresence>
          {allCombinations.length > 0 && (
            <motion.div
              ref={groupsRef}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">
                  combination {currentCombinationIndex + 1} of{" "}
                  {allCombinations.length}
                </h2>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCombinationIndex(
                        Math.max(0, currentCombinationIndex - 1)
                      )
                    }
                    disabled={currentCombinationIndex === 0}
                  >
                    <FiChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCombinationIndex(
                        Math.min(
                          allCombinations.length - 1,
                          currentCombinationIndex + 1
                        )
                      )
                    }
                    disabled={
                      currentCombinationIndex === allCombinations.length - 1
                    }
                  >
                    <FiChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <AnimatePresence mode="popLayout">
                  {currentGroups.map((group, index) => (
                    <motion.div
                      key={`${currentCombinationIndex}-${index}`}
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default App;
