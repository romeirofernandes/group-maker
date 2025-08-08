import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiPlus, FiX, FiUsers, FiShuffle, FiSettings } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

const App = () => {
  const [names, setNames] = useState([]);
  const [currentName, setCurrentName] = useState("");
  const [groupSize, setGroupSize] = useState(2);
  const [restrictions, setRestrictions] = useState([]);
  const [currentRestriction, setCurrentRestriction] = useState({
    person1: "",
    person2: "",
  });
  const [debouncedRestriction, setDebouncedRestriction] = useState({
    person1: "",
    person2: "",
  });
  const [groups, setGroups] = useState([]);
  const [showRestrictions, setShowRestrictions] = useState(false);

  // Debounce effect for restriction inputs
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedRestriction(currentRestriction);
    }, 300); // 300ms debounce delay

    return () => {
      clearTimeout(handler);
    };
  }, [currentRestriction]);

  const addName = () => {
    if (
      currentName.trim() &&
      !names.includes(currentName.trim().toLowerCase())
    ) {
      setNames([...names, currentName.trim().toLowerCase()]);
      setCurrentName("");
    }
  };

  const removeName = (nameToRemove) => {
    setNames(names.filter((name) => name !== nameToRemove));
    // Remove restrictions involving this person
    setRestrictions(
      restrictions.filter(
        (r) => r.person1 !== nameToRemove && r.person2 !== nameToRemove
      )
    );
  };

  const addRestriction = () => {
    const { person1, person2 } = debouncedRestriction;
    if (
      person1.trim() &&
      person2.trim() &&
      names.includes(person1.trim().toLowerCase()) &&
      names.includes(person2.trim().toLowerCase()) &&
      person1.trim().toLowerCase() !== person2.trim().toLowerCase()
    ) {
      const newRestriction = {
        person1: person1.trim().toLowerCase(),
        person2: person2.trim().toLowerCase(),
      };

      const exists = restrictions.some(
        (r) =>
          (r.person1 === newRestriction.person1 &&
            r.person2 === newRestriction.person2) ||
          (r.person1 === newRestriction.person2 &&
            r.person2 === newRestriction.person1)
      );

      if (!exists) {
        setRestrictions([...restrictions, newRestriction]);
        setCurrentRestriction({ person1: "", person2: "" });
      }
    }
  };

  const removeRestriction = (index) => {
    setRestrictions(restrictions.filter((_, i) => i !== index));
  };

  const generateGroups = () => {
    if (names.length < 2 || names.length % groupSize !== 0) return;

    const shuffled = [...names].sort(() => Math.random() - 0.5);
    const newGroups = [];

    // Simple group generation - can be improved with constraint satisfaction
    for (let i = 0; i < shuffled.length; i += groupSize) {
      const group = shuffled.slice(i, i + groupSize);

      // Check if group violates any restrictions
      const hasRestriction = restrictions.some(
        (r) => group.includes(r.person1) && group.includes(r.person2)
      );

      if (!hasRestriction || newGroups.length === 0) {
        newGroups.push(group);
      } else {
        // Simple retry - in a real app you'd want more sophisticated constraint solving
        i -= groupSize;
        continue;
      }
    }

    setGroups(newGroups);
  };

  const canGenerateGroups = names.length >= 2 && names.length % groupSize === 0;

  return (
    <div className="min-h-screen bg-background text-foreground p-4">
      <div className="mx-auto max-w-3xl space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            f*ck groups.
          </h1>
          <p className="text-muted-foreground text-lg">
            there's always someone that gets left out.
          </p>
        </motion.div>

        {/* Name Input */}
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
                <Button onClick={addName} size="icon">
                  <FiPlus className="w-4 h-4" />
                </Button>
              </div>

              {names.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-wrap gap-2"
                >
                  <AnimatePresence>
                    {names.map((name, index) => (
                      <motion.div
                        key={name}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ delay: index * 0.05 }}
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

        {/* Group Settings */}
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
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium">group size:</label>
                  <Input
                    type="number"
                    min="2"
                    max={Math.floor(names.length / 2)}
                    value={groupSize}
                    onChange={(e) =>
                      setGroupSize(parseInt(e.target.value) || 2)
                    }
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">
                    ({Math.floor(names.length / groupSize)} groups possible)
                  </span>
                </div>

                <div className="space-y-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowRestrictions(!showRestrictions)}
                    className="w-full"
                  >
                    {showRestrictions ? "hide" : "add"} restrictions
                  </Button>

                  <AnimatePresence>
                    {showRestrictions && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-3 pt-2"
                      >
                        <div className="flex gap-2">
                          <Input
                            placeholder="person 1..."
                            value={currentRestriction.person1}
                            onChange={(e) =>
                              setCurrentRestriction({
                                ...currentRestriction,
                                person1: e.target.value,
                              })
                            }
                            className="flex-1"
                          />
                          <span className="flex items-center text-muted-foreground">
                            ≠
                          </span>
                          <Input
                            placeholder="person 2..."
                            value={currentRestriction.person2}
                            onChange={(e) =>
                              setCurrentRestriction({
                                ...currentRestriction,
                                person2: e.target.value,
                              })
                            }
                            className="flex-1"
                          />
                          <Button
                            onClick={addRestriction}
                            size="icon"
                            variant="outline"
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
                              {restrictions.map((restriction, index) => (
                                <motion.div
                                  key={index}
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
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

        {/* Generate Button */}
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
                : `need ${groupSize - (names.length % groupSize)} more names`}
            </Button>
          </motion.div>
        )}

        {/* Generated Groups */}
        <AnimatePresence>
          {groups.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              className="space-y-4"
            >
              <h2 className="text-2xl font-bold text-center">
                your groups are ready
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {groups.map((group, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
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
                                delay: index * 0.1 + memberIndex * 0.05,
                              }}
                            >
                              <Badge variant="outline" className="text-sm py-1">
                                {member}
                              </Badge>
                            </motion.div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
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
