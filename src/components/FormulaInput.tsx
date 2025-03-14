"use client";

import { useQuery } from "@tanstack/react-query";
import { evaluate } from "mathjs";
import { useEffect, useRef, useState } from "react";
import Select, { StylesConfig } from "react-select";
import { fetchSuggestions } from "../lib/api";
import { useFormulaStore } from "../stores/formulaStore";

interface FormulaTag {
  type: "tag";
  name: string;
  value: string | number;
}

interface FormulaText {
  type: "text";
  value: string;
}

type FormulaItem = FormulaTag | FormulaText;

export default function FormulaInput() {
  const { formula, setFormula } = useFormulaStore();
  const [inputValue, setInputValue] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [evaluatedResult, setEvaluatedResult] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: allSuggestions = [] } = useQuery({
    queryKey: ["autocomplete"],
    queryFn: () => fetchSuggestions(""),
    staleTime: Infinity,
  });

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    evaluateExpression();
  }, [formula]);

  const getLastWord = (value: string): string => {
    const parts = value.split(/[\s+\-*/^()=]+/);
    return parts[parts.length - 1];
  };

  const filterSuggestions = (lastWord: string) => {
    return allSuggestions.filter(({ name }: { name: string }) =>
      name.toLowerCase().includes(lastWord.toLowerCase())
    );
  };

  const evaluateExpression = () => {
    try {
      const expression = formula
        .map((item) => {
          if (item.type === "tag") {
            return `(${item.value})`;
          }
          return item.value;
        })
        .join(" ");

      const result = evaluate(expression);
      setEvaluatedResult(!isNaN(result) ? result : null);
    } catch {
      setEvaluatedResult(null);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setShowDropdown(/^[a-zA-Z]+$/.test(getLastWord(value)));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && inputValue === "" && formula.length > 0) {
      setFormula(formula.slice(0, -1));
    } else if (e.key === "Enter" && inputValue.trim()) {
      addFormulaItem();
    } else if (e.key === "ArrowDown") {
      setShowDropdown(true);
    }
  };

  const addFormulaItem = () => {
    const lastWord = getLastWord(inputValue);
    if (/^[a-zA-Z]+$/.test(lastWord)) {
      setFormula([...formula, { type: "tag", name: lastWord.trim(), value: lastWord.trim() }]);
    } else {
      setFormula([...formula, { type: "text", value: inputValue.trim() }]);
    }
    setInputValue("");
    setShowDropdown(false);
    evaluateExpression();
  };

  const handleSelectChange = (selectedOption: { name: string; value: string | number } | null) => {
    if (selectedOption) {
      const newFormula = [...formula];

      if (inputValue.trim()) {
        newFormula.push({
          type: "text",
          value: inputValue.replace(new RegExp(`${getLastWord(inputValue)}$`), "").trim(),
        });
      }

      newFormula.push({ type: "tag", name: selectedOption.name, value: selectedOption.value });

      setFormula(newFormula);
      setInputValue("");
      setShowDropdown(false);
      evaluateExpression();
    }
  };

  const customStyles: StylesConfig = {
    control: (provided) => ({
      ...provided,
      display: "none",
    }),
    menu: (provided) => ({
      ...provided,
      marginTop: 0,
    }),
  };

  return (
    <div className="relative w-1/2 border-2 p-2 flex flex-wrap items-center border-pink-500">
      {formula.map((item, index) =>
        item.type === "tag" ? (
          <span
            key={index}
            className="bg-blue-50 px-2 py-1 mr-2 rounded-full border border-blue-100 text-blue-500 capitalize font-medium text-sm"
          >
            {item.name} ({item.value})
          </span>
        ) : (
          <span key={index} className="text-gray-800 mr-2">
            {item.value}
          </span>
        )
      )}
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        className="flex-1 border-none outline-none"
        onFocus={() => setShowDropdown(/^[a-zA-Z]+$/.test(getLastWord(inputValue)))}
      />
      {showDropdown && (
        <Select
          options={filterSuggestions(getLastWord(inputValue)).map(
            ({ name, value }: { name: string; value: string | number }) => ({
              label: `${name} - Value: ${value}`,
              value: { name, value },
            })
          )}
          onChange={(option: any) => handleSelectChange(option?.value || null)}
          className="w-full mt-1"
          menuIsOpen={true}
          styles={customStyles}
        />
      )}
      {evaluatedResult !== null && (
        <div className="absolute bottom-[-30px] left-0 text-gray-600">= {evaluatedResult}</div>
      )}
    </div>
  );
}