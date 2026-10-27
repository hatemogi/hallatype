;; clojure convert.clj < hangul-jamo-source.fnt
(require '[clojure.string :refer [split join]])

(defn 글꼴들 [in]
  (letfn [(bit->hex [bits] (Integer/parseInt bits 2))]
    (->> (-> (slurp in)
             (split #"\n"))
         (partition 17)
         (map (partial drop 1))
         flatten
         (map bit->hex)
         (partition 16))))

(defn ->js [글꼴]
  (str "[" (join ", " 글꼴) "]"))

(println (str "const bitmaps =\n  [" (join ",\n   " (map ->js (글꼴들 *in*))) "];"))
