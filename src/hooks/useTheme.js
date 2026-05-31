import { useState, useEffect, useCallback } from 'react'
import { getUser, saveUser } from '../db'

export function useTheme() {
  const [theme, setThemeState] = useState('light')

  useEffect(() => {
    getUser().then((user) => {
      if (user?.theme) {
        setThemeState(user.theme)
        document.body.setAttribute('data-theme', user.theme)
      }
    })
  }, [])

  const setTheme = useCallback(
    async (newTheme) => {
      setThemeState(newTheme)
      document.body.setAttribute('data-theme', newTheme)
      const user = await getUser()
      if (user) {
        await saveUser({ ...user, theme: newTheme })
      }
    },
    []
  )

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }, [theme, setTheme])

  return { theme, setTheme, toggleTheme }
}
